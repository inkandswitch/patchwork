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
  RefContext,
  InferRefType,
  ChangeFn,
} from "./types";
import { KIND } from "./types";
import { isSegment, isPlainObject } from "./guards";
import { matchesWhereClause } from "./utils";
import {
  parseAutomergeRefUrl,
  stringifyAutomergeRefUrl,
  type AutomergeRefUrl,
} from "./parser";

/**
 * A reference to a location in an Automerge document.
 *
 * Refs are stable by default - they track objects by ID, not position.
 *
 * @example
 * ```ts
 * const titleRef = ref(handle, 'todos', 0, 'title');
 * titleRef.value();           // string | undefined
 * titleRef.change(s => s.toUpperCase());
 * titleRef.on('change', () => console.log('changed!'));
 * ```
 */
export class Ref<TDoc = any, TPath extends readonly PathInput[] = PathInput[]> {
  readonly docHandle: DocHandle<TDoc>;
  readonly path: PathSegment[];
  readonly range?: RangeSegment;
  readonly options: RefOptions;

  #unsubscribe: () => void;

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

    // Subscribe to document changes to keep resolved props fresh
    const updateHandler = () => {
      const currentDoc = this.docHandle.doc();
      this.#updateResolvedProps(currentDoc);
    };
    this.docHandle.on("change", updateHandler);
    this.#unsubscribe = () => this.docHandle.off("change", updateHandler);
  }

  set heads(heads: string[] | undefined) {
    this.options.heads = heads;
  }

  get heads(): string[] | undefined {
    return this.options.heads;
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
   */
  change(fn: ChangeFn<InferRefType<TDoc, TPath>>): void {
    if (this.options.heads) {
      throw new Error("Cannot change a Ref pinned to specific heads");
    }

    this.docHandle.change((doc: Doc<TDoc>) => {
      // Root document change - behave like docHandle.change()
      if (this.path.length === 0 && !this.range) {
        fn(doc as InferRefType<TDoc, TPath>, this.#getContext(doc, []));
        return;
      }

      // Resolve path (throws if unresolved)
      const propPath = this.#getPropPath();
      if (!propPath) throw new Error("Cannot resolve path");

      // Get current value (unified)
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

      // Call user function
      const newValue = fn(
        current as InferRefType<TDoc, TPath>,
        this.#getContext(doc, propPath)
      );
      if (newValue === undefined) return;

      // Apply change (dispatch by type)
      if (this.range) {
        this.#spliceRange(doc, propPath, this.range, newValue as string);
      } else {
        this.#setValueAt(doc, propPath, newValue);
      }
    });
  }

  /** Subscribe to changes that affect this ref's value */
  onChange(
    callback: (payload: DocHandleChangePayload<any>) => void
  ): () => void {
    const wrappedCallback = (payload: DocHandleChangePayload<any>) => {
      if (this.#patchAffectsRef(payload.patches)) {
        callback(payload);
      }
    };

    this.docHandle.on("change", wrappedCallback);

    return () => {
      this.docHandle.off("change", wrappedCallback);
    };
  }

  get url(): AutomergeRefUrl {
    // Combine path and range for serialization
    const allSegments: Segment[] = this.range
      ? [...this.path, this.range]
      : this.path;

    return stringifyAutomergeRefUrl(
      this.docHandle.documentId,
      allSegments,
      this.options.heads
    );
  }

  equals(other: Ref<any>): boolean {
    return this.url === other.url;
  }

  valueOf(): string {
    return this.url;
  }

  toString(): string {
    return this.url;
  }

  /** Clean up and unsubscribe from document changes */
  dispose(): void {
    this.#unsubscribe();
  }

  /**
   * Create context helpers for the change callback.
   * Operates on the current doc proxy within an active change transaction.
   */
  #getContext(doc: Doc<TDoc>, propPath: Prop[]): RefContext {
    return {
      splice: (index: number, deleteCount: number, insert?: string) => {
        Automerge.splice(doc, propPath, index, deleteCount, insert);
      },
      updateText: (newValue: string) => {
        Automerge.updateText(doc, propPath, newValue);
      },
    };
  }

  /**
   * Normalize path inputs and extract stable IDs where possible.
   * Single O(D) pass - maintains current container and propPath as we traverse.
   * Returns path segments and optional range segment separately.
   */
  #normalizePath(
    doc: Doc<TDoc>,
    inputs: PathInput[]
  ): { path: PathSegment[]; range?: RangeSegment } {
    const pathSegments: PathSegment[] = [];
    const propPath: Automerge.Prop[] = []; // Build incrementally for range stabilization
    let current: any = doc;
    let rangeSegment: RangeSegment | undefined;

    for (const input of inputs) {
      // Handle ranges specially - they need the propPath for cursor stabilization
      if (Array.isArray(input) && input.length === 2) {
        rangeSegment = this.#tryStabilizeRange(
          doc,
          propPath,
          current,
          input[0],
          input[1]
        );
        break; // Ranges are terminal
      }

      const segment = isSegment(input)
        ? this.#ensureSegmentResolved(current, input)
        : this.#normalizeInput(current, input as Exclude<PathInput, Segment>);

      // If input was a range segment, extract it
      if (segment[KIND] === "range" || segment[KIND] === "stable_range") {
        rangeSegment = segment;
        break;
      }

      pathSegments.push(segment as PathSegment);

      // Move to next container and extend propPath for next iteration
      if (
        segment.resolvedProp !== undefined &&
        current !== undefined &&
        current !== null
      ) {
        propPath.push(segment.resolvedProp);
        current = (current as any)[segment.resolvedProp];
      }
      // If we can't resolve, subsequent segments will also fail, but we continue
      // to let them attempt resolution (they'll get resolvedProp = undefined)
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
          matchesWhereClause(item, segment.clause)
        );
        return queryIndex !== -1 ? queryIndex : undefined;

      case "range":
      case "stable_range":
        // Ranges don't have resolvedProp (should not be called for ranges)
        return undefined;

      default:
        segment satisfies never;
        return undefined;
    }
  }

  /**
   * Update resolved props for all segments based on current document state.
   * Called on document changes to keep segments fresh.
   */
  /**
   * Update resolved props for all path segments based on current document state.
   * Called on document changes to keep segments fresh. Single O(D) pass.
   */
  #updateResolvedProps(doc: Doc<TDoc>): void {
    let current = doc;

    // No need to check for ranges - path only contains PathSegments!
    for (const segment of this.path) {
      // Resolve and update this segment's prop
      const resolvedProp = this.#resolveSegmentProp(current, segment);
      (segment as any).resolvedProp = resolvedProp;

      // Move to next container
      if (
        resolvedProp !== undefined &&
        current !== undefined &&
        current !== null
      ) {
        current = (current as any)[resolvedProp];
      } else {
        // Can't resolve further - mark remaining segments as unresolved
        break;
      }
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
        return { [KIND]: "query", clause: input, resolvedProp: undefined };
      }

      const index = container.findIndex((obj) =>
        matchesWhereClause(obj, input)
      );
      const item = index !== -1 ? container[index] : undefined;
      const id = item ? Automerge.getObjectId(item) : undefined;

      return id
        ? { [KIND]: "stable_index", id, resolvedProp: index }
        : {
            [KIND]: "query",
            clause: input,
            resolvedProp: index !== -1 ? index : undefined,
          };
    }

    throw new Error(
      `Unsupported path input type: ${typeof input}. ` +
        `Expected string, number, or plain object.`
    );
  }

  /**
   * Try to stabilize a numeric range to a cursor-based range.
   * Returns stable_range if cursors can be obtained, unstable range otherwise.
   */
  #tryStabilizeRange(
    doc: Doc<TDoc>,
    propPath: Automerge.Prop[],
    container: any,
    start: number,
    end: number
  ): RangeSegment {
    // Can only stabilize ranges on strings
    if (typeof container !== "string") {
      return { [KIND]: "range", start, end };
    }

    // Try to get cursors
    const startCursor = Automerge.getCursor(doc, propPath, start);
    const endCursor = Automerge.getCursor(doc, propPath, end);

    return startCursor && endCursor
      ? { [KIND]: "stable_range", start: startCursor, end: endCursor }
      : { [KIND]: "range", start, end };
  }

  /**
   * PRIMITIVE: Extract cached navigation path from segments.
   * Returns undefined if any segment can't be resolved.
   */
  #getPropPath(): Prop[] | undefined {
    const props: Prop[] = [];
    for (const segment of this.path) {
      if (segment.resolvedProp === undefined) return undefined;
      props.push(segment.resolvedProp);
    }
    return props;
  }

  /**
   * PRIMITIVE: Navigate to a value by following a prop path.
   * Simple traversal - returns undefined if any step fails.
   */
  #getValueAt(container: any, propPath: Prop[]): any {
    let current = container;
    for (const prop of propPath) {
      if (current == null) return undefined;
      current = current[prop];
    }
    return current;
  }

  /**
   * PRIMITIVE: Set a value at a prop path.
   * Mutates the parent object at the final key.
   */
  #setValueAt(container: any, propPath: Prop[], value: any): void {
    if (propPath.length === 0) {
      throw new Error(
        "Cannot replace root via setValueAt - use docHandle.change() directly"
      );
    }
    const parent = this.#getValueAt(container, propPath.slice(0, -1));
    if (parent == null) {
      throw new Error("Cannot set value: parent is null or undefined");
    }
    parent[propPath[propPath.length - 1]] = value;
  }

  /**
   * PRIMITIVE: Extract substring from a text value using a range.
   * Returns undefined if the range can't be resolved.
   */
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

  /**
   * PRIMITIVE: Replace a substring at a range using Automerge.splice.
   * Throws if the range can't be resolved.
   */
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

  /**
   * PRIMITIVE: Convert a range segment to numeric [start, end] positions.
   * Handles both numeric ranges and cursor-based ranges.
   */
  #getRangePositions(
    doc: Doc<TDoc>,
    propPath: Prop[],
    range: RangeSegment
  ): [number, number] | undefined {
    if (range[KIND] === "range") {
      // Already numeric
      return [range.start, range.end];
    }

    // stable_range - resolve cursors to positions
    const start = Automerge.getCursorPosition(doc, propPath, range.start);
    const end = Automerge.getCursorPosition(doc, propPath, range.end);

    return start !== undefined && end !== undefined ? [start, end] : undefined;
  }

  #patchAffectsRef(patches: Automerge.Patch[]): boolean {
    // Build best-effort prop path (stops at first unresolved segment)
    // Props are already up-to-date from the internal change listener
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
