import * as Automerge from "@automerge/automerge";
import type { Doc, Prop } from "@automerge/automerge";
import type {
  DocHandle,
  DocHandleChangePayload,
} from "@automerge/automerge-repo";
import type {
  Segment,
  PathSegment,
  RangeSegment,
  PathInput,
  RefOptions,
  InferRefType,
  ChangeFn,
} from "./types";
import { KIND } from "./types";
import { isSegment, isPlainObject } from "./guards";
import { matchesIdPattern, shallowEqual } from "./utils";
import {
  parseAutomergeRefUrl,
  stringifyAutomergeRefUrl,
  type AutomergeRefUrl,
} from "./parser";
import { MutableText } from "./mutable-text";

/**
 * FinalizationRegistry for automatic cleanup of Ref instances.
 * This ensures subscriptions are cleaned up when Refs are garbage collected,
 * even if dispose() is never called.
 */
const refCleanupRegistry = new FinalizationRegistry<() => void>((cleanup) =>
  cleanup()
);

/**
 * A reference to a location in an Automerge document.
 *
 * Refs are stable by default - they track objects by ID, not position.
 *
 * Cleanup: Refs automatically clean up their subscriptions when garbage collected.
 * For immediate cleanup, call dispose() explicitly (recommended for long-lived apps).
 *
 * @example
 * ```ts
 * const titleRef = ref(handle, 'todos', 0, 'title');
 * titleRef.value();           // string | undefined
 * titleRef.change(s => s.toUpperCase());
 * titleRef.onChange(() => console.log('changed!'));
 *
 * // Optional but recommended for immediate cleanup:
 * titleRef.dispose();
 * ```
 */
export class Ref<TDoc = any, TPath extends readonly PathInput[] = PathInput[]> {
  readonly docHandle: DocHandle<TDoc>;
  readonly path: PathSegment[];
  readonly range?: RangeSegment;
  readonly options: RefOptions;

  #unsubscribe: () => void;
  #onChangeSubscriptions = new Set<() => void>();
  #disposed = false;

  constructor(
    docHandle: DocHandle<TDoc>,
    segments: readonly [...TPath],
    options: RefOptions = {}
  ) {
    this.docHandle = docHandle;
    this.options = options;

    const doc = docHandle.doc();
    const { path, range } = this.#normalizePath(
      doc,
      segments as unknown as PathInput[]
    );
    this.path = path;
    this.range = range;

    const updateHandler = () => {
      const currentDoc = this.docHandle.doc();
      this.#updateResolvedProps(currentDoc);
    };
    this.docHandle.on("change", updateHandler);
    this.#unsubscribe = () => this.docHandle.off("change", updateHandler);

    // Register for automatic cleanup when this Ref is garbage collected
    // This ensures subscriptions are cleaned up even if dispose() is never called
    refCleanupRegistry.register(this, () => this.#cleanup(), this);
  }

  get heads(): string[] | undefined {
    return this.options.heads;
  }

  /**
   * Create a new ref viewing the document at specific heads (time-travel).
   * Returns a new Ref instance with the same path but different heads.
   */
  viewAt(heads: string[] | undefined): Ref<TDoc, TPath> {
    return new Ref(this.docHandle, this.path as any, {
      ...this.options,
      heads,
    });
  }

  /**
   * Parse a ref from an Automerge URL string.
   *
   * @param handle - The document handle to use
   * @param url - Full automerge URL like "automerge:documentId/path#heads"
   *
   * @example
   * Ref.fromUrl(handle, "automerge:abc/todos/0#head1|head2" as AutomergeRefUrl)
   */
  static fromUrl<TDoc = any>(
    handle: DocHandle<TDoc>,
    url: AutomergeRefUrl
  ): Ref<TDoc, PathInput[]> {
    const { segments, heads } = parseAutomergeRefUrl(url);
    const options: RefOptions = heads ? { heads } : {};
    return new Ref<TDoc, PathInput[]>(handle, segments, options);
  }

  /** Get the current value, or undefined if path can't be resolved */
  value(): InferRefType<TDoc, TPath> | undefined {
    const doc = this.doc();
    const propPath = this.#getPropPath();
    if (!propPath) return undefined;

    const value = this.#getValueAt(doc, propPath);

    return (
      this.range ? this.#extractRange(doc, propPath, value, this.range) : value
    ) as InferRefType<TDoc, TPath> | undefined;
  }

  doc(): Doc<TDoc> {
    const doc = this.docHandle.doc();
    return this.options.heads ? Automerge.view(doc, this.options.heads) : doc;
  }

  /**
   * Update the value.
   *
   * Primitives: return new value to update, void to skip.
   * Objects/arrays: mutate in place, return void.
   * Strings: receive MutableText with splice/updateText methods.
   */
  change(fn: ChangeFn<InferRefType<TDoc, TPath>>): void {
    if (this.options.heads) {
      throw new Error("Cannot change a Ref pinned to specific heads");
    }

    this.docHandle.change((doc: Doc<TDoc>) => {
      if (this.path.length === 0 && !this.range) {
        fn(doc as any);
        return;
      }

      const propPath = this.#getPropPath();
      if (!propPath) throw new Error("Cannot resolve path");

      let current: any;
      if (this.range) {
        const parent = this.#getValueAt(doc, propPath);
        if (typeof parent !== "string") {
          throw new Error("Range refs can only be used on string values");
        }
        current = this.#extractRange(doc, propPath, parent, this.range);
      } else {
        current = this.#getValueAt(doc, propPath);
      }

      // If current is a string, wrap it in MutableText
      const valueToPass =
        typeof current === "string"
          ? MutableText(doc, propPath, current)
          : current;

      const newValue = fn(valueToPass as any);
      if (newValue === undefined) return;

      // Warn if non-primitive value is returned (should mutate instead)
      const isPrimitive =
        newValue === null ||
        typeof newValue === "string" ||
        typeof newValue === "number" ||
        typeof newValue === "boolean" ||
        typeof newValue === "bigint";

      if (!isPrimitive) {
        console.warn(
          "Ref.change() returned a non-primitive value. For objects and arrays, " +
            "you should mutate them in place rather than returning a new instance. " +
            "Returning new instances loses granular change tracking."
        );
      }

      if (this.range) {
        this.#spliceRange(doc, propPath, this.range, newValue as string);
      } else {
        this.#setValueAt(doc, propPath, newValue);
      }
    });
  }

  /**
   * Subscribe to changes that affect this ref's value.
   *
   * The returned unsubscribe function will automatically be called when the Ref
   * is disposed or garbage collected. You can also call it manually for immediate cleanup.
   */
  onChange(
    callback: (
      value: InferRefType<TDoc, TPath> | undefined,
      payload: DocHandleChangePayload<any>
    ) => void
  ): () => void {
    if (this.#disposed) {
      throw new Error("Cannot add onChange listener to a disposed Ref");
    }

    const wrappedCallback = (payload: DocHandleChangePayload<any>) => {
      if (this.#patchAffectsRef(payload.patches)) {
        const value = this.value();
        callback(value, payload);
      }
    };

    this.docHandle.on("change", wrappedCallback);

    const unsubscribe = () => {
      this.docHandle.off("change", wrappedCallback);
      this.#onChangeSubscriptions.delete(unsubscribe);
    };

    // Track this subscription so it can be cleaned up in dispose()
    this.#onChangeSubscriptions.add(unsubscribe);

    return unsubscribe;
  }

  get url(): AutomergeRefUrl {
    const allSegments: Segment[] = this.range
      ? [...this.path, this.range]
      : this.path;

    return stringifyAutomergeRefUrl(
      this.docHandle.documentId,
      allSegments,
      this.options.heads
    );
  }

  /**
   * Check if this ref is equal to another ref (same document, path, and heads).
   */
  equals(other: Ref<any>): boolean {
    return this.url === other.url;
  }

  /**
   * Check if this ref contains another ref (other is a descendant of this).
   *
   * @example
   * ```ts
   * const todoRef = ref(handle, 'todos', 0);
   * const titleRef = ref(handle, 'todos', 0, 'title');
   * todoRef.contains(titleRef); // true
   * titleRef.contains(todoRef); // false
   * ```
   */
  contains(other: Ref<any>): boolean {
    // Must be same document
    if (this.docHandle.documentId !== other.docHandle.documentId) {
      return false;
    }

    // Must have same or undefined heads
    const thisHeads = this.heads?.join(",");
    const otherHeads = other.heads?.join(",");
    if (thisHeads !== otherHeads) {
      return false;
    }

    // This path must be a prefix of other's path
    if (this.path.length >= other.path.length) {
      return false;
    }

    // Check if all segments match
    for (let i = 0; i < this.path.length; i++) {
      if (!this.#segmentsEqual(this.path[i], other.path[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if this ref overlaps with another ref (for text/range refs).
   * Two refs overlap if they refer to the same parent location and their ranges overlap.
   *
   * @example
   * ```ts
   * const range1 = ref(handle, 'content', [0, 10]);
   * const range2 = ref(handle, 'content', [5, 15]);
   * range1.overlaps(range2); // true
   * ```
   */
  overlaps(other: Ref<any>): boolean {
    // Must be same document
    if (this.docHandle.documentId !== other.docHandle.documentId) {
      return false;
    }

    // Must have same heads
    const thisHeads = this.heads?.join(",");
    const otherHeads = other.heads?.join(",");
    if (thisHeads !== otherHeads) {
      return false;
    }

    // Both must have ranges
    if (!this.range || !other.range) {
      return false;
    }

    // Paths must be identical (same parent location)
    if (this.path.length !== other.path.length) {
      return false;
    }

    for (let i = 0; i < this.path.length; i++) {
      if (!this.#segmentsEqual(this.path[i], other.path[i])) {
        return false;
      }
    }

    // Check if ranges overlap
    // Get the numeric positions for both ranges
    const doc = this.doc();
    const propPath = this.#getPropPath();
    if (!propPath) return false;

    const thisPositions = this.#getRangePositions(doc, propPath, this.range);
    const otherPositions = this.#getRangePositions(doc, propPath, other.range);

    if (!thisPositions || !otherPositions) return false;

    const [thisStart, thisEnd] = thisPositions;
    const [otherStart, otherEnd] = otherPositions;

    // Ranges overlap if: thisStart < otherEnd && otherStart < thisEnd
    return thisStart < otherEnd && otherStart < thisEnd;
  }

  valueOf(): string {
    return this.url;
  }

  toString(): string {
    return this.url;
  }

  /**
   * Clean up and unsubscribe from all document changes.
   *
   * While cleanup happens automatically when the Ref is garbage collected,
   * calling dispose() explicitly provides immediate cleanup which is recommended
   * for long-lived applications or when you know you're done with a Ref.
   *
   * After calling dispose(), the Ref cannot be used anymore and onChange() will throw.
   */
  dispose(): void {
    if (this.#disposed) return;

    // Unregister from automatic cleanup since we're cleaning up now
    refCleanupRegistry.unregister(this);

    this.#cleanup();
  }

  /**
   * Internal cleanup method called by both dispose() and the finalization registry.
   */
  #cleanup(): void {
    if (this.#disposed) return;
    this.#disposed = true;

    // Clean up the main subscription from constructor
    this.#unsubscribe();

    // Clean up all onChange subscriptions
    for (const unsubscribe of this.#onChangeSubscriptions) {
      unsubscribe();
    }
    this.#onChangeSubscriptions.clear();
  }

  /**
   * Normalize path inputs and extract stable IDs where possible.
   */
  #normalizePath(
    doc: Doc<TDoc>,
    inputs: PathInput[]
  ): { path: PathSegment[]; range?: RangeSegment } {
    const pathSegments: PathSegment[] = [];
    const propPath: Automerge.Prop[] = [];
    let current: any = doc;
    let rangeSegment: RangeSegment | undefined;

    for (const input of inputs) {
      if (Array.isArray(input) && input.length === 2) {
        rangeSegment = this.#tryStabilizeRange(
          doc,
          propPath,
          current,
          input[0],
          input[1]
        );
        break;
      }

      const segment = isSegment(input)
        ? this.#ensureSegmentResolved(current, input)
        : this.#normalizeInput(current, input as Exclude<PathInput, Segment>);

      if (segment[KIND] === "range" || segment[KIND] === "stable_range") {
        rangeSegment = segment;
        break;
      }

      pathSegments.push(segment as PathSegment);

      if (
        segment.resolvedProp !== undefined &&
        current !== undefined &&
        current !== null
      ) {
        propPath.push(segment.resolvedProp);
        current = (current as any)[segment.resolvedProp];
      }
    }

    return { path: pathSegments, range: rangeSegment };
  }

  /** Ensure a segment has its resolvedProp set */
  #ensureSegmentResolved(container: any, segment: Segment): Segment {
    const resolvedProp = this.#resolveSegmentProp(container, segment);
    return { ...segment, resolvedProp } as Segment;
  }

  /**
   * Resolve a path segment to its Automerge prop.
   * Returns undefined if the segment cannot be resolved.
   */
  #resolveSegmentProp(
    container: any,
    segment: Segment
  ): string | number | undefined {
    if (container === undefined || container === null) return undefined;

    switch (segment[KIND]) {
      case "key":
        return segment.key;

      case "index":
        return segment.index;

      case "stable_index":
        if (!Array.isArray(container)) return undefined;
        const index = container.findIndex(
          (item) => Automerge.getObjectId(item) === segment.id
        );
        return index !== -1 ? index : undefined;

      case "query":
        if (!Array.isArray(container)) return undefined;
        const queryIndex = container.findIndex((item) =>
          matchesIdPattern(item, segment.idPattern)
        );
        return queryIndex !== -1 ? queryIndex : undefined;

      case "range":
      case "stable_range":
        return undefined;

      default:
        segment satisfies never;
        return undefined;
    }
  }

  /** Update resolved props for all path segments based on current document state */
  #updateResolvedProps(doc: Doc<TDoc>): void {
    let current = doc;

    for (const segment of this.path) {
      const resolvedProp = this.#resolveSegmentProp(current, segment);
      // Internal mutation: Update cached resolvedProp for efficient path resolution.
      // Safe because segments are owned by this Ref instance.
      (segment as any).resolvedProp = resolvedProp;

      if (
        resolvedProp !== undefined &&
        current !== undefined &&
        current !== null
      ) {
        current = (current as any)[resolvedProp];
      } else {
        break;
      }
    }
  }

  /**
   * Check if two PathSegments are equal.
   * Used by `contains` and `overlaps` methods.
   */
  #segmentsEqual(a: PathSegment, b: PathSegment): boolean {
    if (a[KIND] !== b[KIND]) {
      return false;
    }

    switch (a[KIND]) {
      case "key":
        return a.key === (b as typeof a).key;
      case "index":
        return a.index === (b as typeof a).index;
      case "stable_index":
        return a.id === (b as typeof a).id;
      case "query":
        return shallowEqual(a.idPattern, (b as typeof a).idPattern);
      default:
        a satisfies never;
        return false;
    }
  }

  #normalizeInput(container: any, input: Exclude<PathInput, Segment>): Segment {
    if (typeof input === "string") {
      return { [KIND]: "key", key: input, resolvedProp: input };
    }

    if (typeof input === "number") {
      if (!Array.isArray(container)) {
        return { [KIND]: "index", index: input, resolvedProp: input };
      }

      const item = container[input];
      const id = item ? Automerge.getObjectId(item) : undefined;

      return id
        ? { [KIND]: "stable_index", id, resolvedProp: input }
        : { [KIND]: "index", index: input, resolvedProp: input };
    }

    if (isPlainObject(input)) {
      if (!Array.isArray(container)) {
        return { [KIND]: "query", idPattern: input, resolvedProp: undefined };
      }

      const index = container.findIndex((obj) => matchesIdPattern(obj, input));
      const item = index !== -1 ? container[index] : undefined;
      const id = item ? Automerge.getObjectId(item) : undefined;

      return id
        ? { [KIND]: "stable_index", id, resolvedProp: index }
        : {
            [KIND]: "query",
            idPattern: input,
            resolvedProp: index !== -1 ? index : undefined,
          };
    }

    throw new Error(
      `Unsupported path input type: ${typeof input}. ` +
        `Expected string, number, or plain object.`
    );
  }

  /** Try to stabilize a numeric range to a cursor-based range */
  #tryStabilizeRange(
    doc: Doc<TDoc>,
    propPath: Automerge.Prop[],
    container: any,
    start: number,
    end: number
  ): RangeSegment {
    if (typeof container !== "string") {
      return { [KIND]: "range", start, end };
    }

    const startCursor = Automerge.getCursor(doc, propPath, start);
    const endCursor = Automerge.getCursor(doc, propPath, end);

    return startCursor && endCursor
      ? { [KIND]: "stable_range", start: startCursor, end: endCursor }
      : { [KIND]: "range", start, end };
  }

  /** Extract cached navigation path from segments */
  #getPropPath(): Prop[] | undefined {
    const props: Prop[] = [];
    for (const segment of this.path) {
      if (segment.resolvedProp === undefined) return undefined;
      props.push(segment.resolvedProp);
    }
    return props;
  }

  /** Navigate to a value by following a prop path */
  #getValueAt(container: any, propPath: Prop[]): any {
    let current = container;
    for (const prop of propPath) {
      if (current == null) return undefined;
      current = current[prop];
    }
    return current;
  }

  /** Extract substring from a text value using a range */
  #extractRange(
    doc: Doc<TDoc>,
    propPath: Prop[],
    text: string,
    range: RangeSegment
  ): string | undefined {
    const positions = this.#getRangePositions(doc, propPath, range);
    if (!positions) return undefined;
    return text.slice(positions[0], positions[1]);
  }
  /** Set a value at a prop path (change-only: mutates the doc proxy) */
  #setValueAt(container: any, propPath: Prop[], value: any): void {
    if (propPath.length === 0) {
      throw new Error(
        "Internal error: #setValueAt called with empty path. " +
          "Root document changes should be handled by the caller."
      );
    }
    const parent = this.#getValueAt(container, propPath.slice(0, -1));
    if (parent == null) {
      throw new Error("Cannot set value: parent is null or undefined");
    }
    parent[propPath[propPath.length - 1]] = value;
  }

  /** Replace a substring at a range using Automerge.splice (change-only: mutates the doc proxy) */
  #spliceRange(
    doc: Doc<TDoc>,
    propPath: Prop[],
    range: RangeSegment,
    newValue: string
  ): void {
    const positions = this.#getRangePositions(doc, propPath, range);
    if (!positions) {
      throw new Error("Cannot resolve range positions");
    }

    const [start, end] = positions;
    Automerge.splice(doc, propPath, start, end - start, newValue);
  }

  /** Convert a range segment to numeric [start, end] positions */
  #getRangePositions(
    doc: Doc<TDoc>,
    propPath: Prop[],
    range: RangeSegment
  ): [number, number] | undefined {
    if (range[KIND] === "range") {
      return [range.start, range.end];
    }

    const start = Automerge.getCursorPosition(doc, propPath, range.start);
    const end = Automerge.getCursorPosition(doc, propPath, range.end);

    return start !== undefined && end !== undefined ? [start, end] : undefined;
  }

  #patchAffectsRef(patches: Automerge.Patch[]): boolean {
    const refPropPath: Prop[] = [];
    for (const segment of this.path) {
      if (segment.resolvedProp === undefined) break;
      refPropPath.push(segment.resolvedProp);
    }

    // If we couldn't resolve any part, ref was never valid - don't fire
    if (refPropPath.length === 0) return false;

    return patches.some((patch) => this.#pathsOverlap(patch.path, refPropPath));
  }

  #pathsOverlap(
    patchPath: Automerge.Prop[],
    refPropPath: Automerge.Prop[]
  ): boolean {
    const minLength = Math.min(patchPath.length, refPropPath.length);
    return patchPath
      .slice(0, minLength)
      .every((prop, i) => prop === refPropPath[i]);
  }
}
