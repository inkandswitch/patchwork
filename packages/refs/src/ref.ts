import * as Automerge from "@automerge/automerge";
import type { Doc, Cursor, Prop } from "@automerge/automerge";
import type {
  DocHandle,
  DocHandleChangePayload,
} from "@automerge/automerge-repo";
import type {
  Segment,
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
  readonly path: Segment[];
  readonly options: RefOptions;

  // NOTE: this is a bit hacky. Would like some better options for this.
  // Perhaps we can make the Automerge.splice and Automerge.updateText methods
  // "just work" with refs. That seems like a better approach...
  #ctx?: RefContext;
  #unsubscribe: () => void;

  constructor(
    docHandle: DocHandle<TDoc>,
    segments: readonly [...TPath],
    options: RefOptions = {}
  ) {
    this.docHandle = docHandle;
    this.options = options;

    const doc = docHandle.doc();
    this.path = this.#normalizePath(doc, segments as unknown as PathInput[]);

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
    return this.#traverse(doc, this.path);
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
      if (this.path.length === 0) {
        fn(doc as InferRefType<TDoc, TPath>, this.#getContext());
        return;
      }

      const currentValue = this.#traverse(doc, this.path);
      const newValue = fn(
        currentValue as InferRefType<TDoc, TPath>,
        this.#getContext()
      );

      // Only set if a value was returned (not void/undefined)
      if (newValue !== undefined) {
        this.#setValue(doc, this.path, newValue);
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
    return stringifyAutomergeRefUrl(
      this.docHandle.documentId,
      this.path,
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

  #getContext(): RefContext {
    return (this.#ctx ??= {
      splice: (index: number, deleteCount: number, insert?: string) => {
        this.docHandle.change((doc: Doc<TDoc>) => {
          const propPath = this.#getPropPathOrThrow(this.path);
          Automerge.splice(doc, propPath, index, deleteCount, insert);
        });
      },
      updateText: (newValue: string) => {
        this.docHandle.change((doc: Doc<TDoc>) => {
          const propPath = this.#getPropPathOrThrow(this.path);
          Automerge.updateText(doc, propPath, newValue);
        });
      },
    });
  }

  /** Normalize path inputs and extract stable IDs where possible */
  #normalizePath(doc: Doc<TDoc>, inputs: PathInput[]): Segment[] {
    let currentPath: Segment[] = [];

    return inputs.map((input) => {
      const segment = isSegment(input)
        ? this.#ensureSegmentResolved(doc, currentPath, input)
        : this.#normalizeInput(
            doc,
            currentPath,
            input as Exclude<PathInput, Segment>
          );

      currentPath.push(segment);
      return segment;
    });
  }

  /** Ensure a segment has its resolvedProp set */
  #ensureSegmentResolved(
    doc: Doc<TDoc>,
    currentPath: Segment[],
    segment: Segment
  ): Segment {
    const container = this.#traverse(doc, currentPath);
    const resolvedProp = this.#resolveSegmentProp(container, segment);
    return { ...segment, resolvedProp } as Segment;
  }

  /**
   * Resolve a segment to its Automerge prop.
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
        // Ranges don't have resolvedProp
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
  #updateResolvedProps(doc: Doc<TDoc>): void {
    let current = doc;

    for (const segment of this.path) {
      // Skip ranges (they don't have resolvedProp)
      if (segment[KIND] === "range" || segment[KIND] === "stable_range") {
        continue;
      }

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

  #normalizeInput(
    doc: Doc<TDoc>,
    currentPath: Segment[],
    input: Exclude<PathInput, Segment>
  ): Segment {
    if (typeof input === "string") {
      return { [KIND]: "key", key: input, resolvedProp: input };
    }

    if (typeof input === "number") {
      const container = this.#traverse(doc, currentPath);
      if (!Array.isArray(container)) {
        return { [KIND]: "index", index: input, resolvedProp: input };
      }

      const item = container[input];
      const id = item ? Automerge.getObjectId(item) : undefined;

      return id
        ? { [KIND]: "stable_index", id, resolvedProp: input }
        : { [KIND]: "index", index: input, resolvedProp: input };
    }

    if (Array.isArray(input) && input.length === 2) {
      return this.#tryStabilizeRange(doc, currentPath, input[0], input[1]);
    }

    if (isPlainObject(input)) {
      const container = this.#traverse(doc, currentPath);
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
        `Expected string, number, plain object, or array.`
    );
  }

  /**
   * Try to stabilize a numeric range to a cursor-based range.
   * Returns stable_range if cursors can be obtained, unstable range otherwise.
   */
  #tryStabilizeRange(
    doc: Doc<TDoc>,
    currentPath: Segment[],
    start: number,
    end: number
  ): Segment {
    const container = this.#traverse(doc, currentPath);
    if (typeof container !== "string") {
      return { [KIND]: "range", start, end };
    }

    const propPath = this.#getPropPath(currentPath);
    if (!propPath) {
      return { [KIND]: "range", start, end };
    }

    const startCursor = Automerge.getCursor(doc, propPath, start);
    const endCursor = Automerge.getCursor(doc, propPath, end);

    return startCursor && endCursor
      ? { [KIND]: "stable_range", start: startCursor, end: endCursor }
      : { [KIND]: "range", start, end };
  }

  #traverse(container: any, path: Segment[]): any {
    let current = container;

    for (const segment of path) {
      if (current === undefined || current === null) {
        return undefined;
      }

      // Handle ranges specially (they need the text/array value)
      if (segment[KIND] === "range" || segment[KIND] === "stable_range") {
        return this.#getRange(current, [segment.start, segment.end] as
          | [Cursor, Cursor]
          | [number, number]);
      }

      // All other segments use resolvedProp
      if (segment.resolvedProp === undefined) {
        return undefined;
      }

      current = current[segment.resolvedProp];
    }

    return current;
  }

  #getRange(
    text: string,
    range: [Automerge.Cursor, Automerge.Cursor] | [number, number]
  ): string | undefined {
    // Check if it's a numeric range (both elements are numbers)
    if (typeof range[0] === "number" && typeof range[1] === "number") {
      return text.slice(range[0], range[1]);
    }

    // Otherwise it's a cursor range - resolve to positions
    const doc = this.doc();
    const textPath = this.path.slice(0, -1);
    const positions = this.#resolveCursorRange(
      doc,
      textPath,
      range[0] as Cursor,
      range[1] as Cursor
    );

    if (!positions) return undefined;
    return text.slice(positions[0], positions[1]);
  }

  /**
   * Resolve cursor range to numeric positions.
   * Returns undefined if cursors are invalid or path cannot be resolved.
   */
  #resolveCursorRange(
    doc: Doc<TDoc>,
    path: Segment[],
    startCursor: Cursor,
    endCursor: Cursor
  ): [number, number] | undefined {
    const propPath = this.#getPropPath(path);
    if (!propPath) return undefined;

    const start = Automerge.getCursorPosition(doc, propPath, startCursor);
    const end = Automerge.getCursorPosition(doc, propPath, endCursor);

    if (start === undefined || end === undefined) return undefined;
    return [start, end];
  }

  #setValue(doc: any, path: Segment[], value: any): void {
    if (path.length === 0) {
      throw new Error("Cannot replace root document");
    }

    const parentPath = path.slice(0, -1);
    const lastSegment = path[path.length - 1];
    const parent = this.#traverse(doc, parentPath);

    if (!parent) {
      throw new Error("Cannot set value: parent is undefined");
    }

    switch (lastSegment[KIND]) {
      case "key":
      case "index":
      case "stable_index":
      case "query":
        // All these use resolvedProp
        if (lastSegment.resolvedProp === undefined) {
          throw new Error("Cannot set value: segment is unresolved");
        }
        parent[lastSegment.resolvedProp] = value;
        break;

      case "range":
      case "stable_range": {
        // Replace substring in text
        if (typeof parent !== "string") {
          throw new Error(
            "Range segments can only be used on text/string values"
          );
        }

        let start: number;
        let end: number;

        if (lastSegment[KIND] === "range") {
          start = lastSegment.start;
          end = lastSegment.end;
        } else {
          // stable_range - resolve cursors to positions
          const positions = this.#resolveCursorRange(
            doc,
            parentPath,
            lastSegment.start,
            lastSegment.end
          );
          if (!positions) {
            throw new Error("Cannot resolve cursor positions for range update");
          }
          [start, end] = positions;
        }

        // Replace the text range using Automerge splice
        const propPath = this.#getPropPathOrThrow(parentPath);
        const deleteCount = end - start;
        Automerge.splice(doc, propPath, start, deleteCount, value);
        break;
      }

      default:
        lastSegment satisfies never;
        throw new Error(`Unknown segment kind: ${lastSegment[KIND]}`);
    }
  }

  #patchAffectsRef(patches: Automerge.Patch[]): boolean {
    // Get the best-effort prop path (stops at first unresolved segment)
    // Props are already up-to-date from the internal change listener
    const refPropPath = this.#getBestEffortPropPath();

    // If we couldn't resolve any part, ref was never valid - don't fire
    if (refPropPath.length === 0) return false;

    return patches.some((patch) => this.#pathsOverlap(patch.path, refPropPath));
  }

  /**
   * Get prop path for as many segments as possible, stopping at first unresolved segment.
   * Used for onChange to detect when a ref becomes invalid (fires once) vs stays invalid (silent).
   */
  #getBestEffortPropPath(): Prop[] {
    const propPath: Prop[] = [];

    for (const segment of this.path) {
      // Skip ranges
      if (segment[KIND] === "range" || segment[KIND] === "stable_range") {
        continue;
      }

      // Stop at first unresolved segment
      if (segment.resolvedProp === undefined) {
        break;
      }

      propPath.push(segment.resolvedProp);
    }

    return propPath;
  }

  /**
   * Get Automerge prop path from segments.
   * Returns undefined if any segment cannot be resolved.
   */
  #getPropPath(segments: Segment[]): Prop[] | undefined {
    const props: Prop[] = [];

    for (const segment of segments) {
      // Skip ranges
      if (segment[KIND] === "range" || segment[KIND] === "stable_range") {
        continue;
      }

      if (segment.resolvedProp === undefined) {
        return undefined;
      }

      props.push(segment.resolvedProp);
    }

    return props;
  }

  /**
   * Get Automerge prop path from segments, throwing if any cannot be resolved.
   */
  #getPropPathOrThrow(segments: Segment[]): Prop[] {
    const props = this.#getPropPath(segments);
    if (!props) {
      throw new Error(
        "Cannot resolve path: one or more segments are unresolved"
      );
    }
    return props;
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
