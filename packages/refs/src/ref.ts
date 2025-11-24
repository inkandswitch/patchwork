import * as Automerge from "@automerge/automerge";
import type { Doc, Cursor, Prop } from "@automerge/automerge";
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
    return this.#traverse(doc, this.path, this.range);
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
        fn(doc as InferRefType<TDoc, TPath>, this.#getContext());
        return;
      }

      // Range change - replace substring
      if (this.range) {
        const parent = this.#traverse(doc, this.path);
        if (typeof parent !== "string") {
          throw new Error("Range refs can only be used on string values");
        }

        const currentValue = this.#getRange(parent, [
          this.range.start,
          this.range.end,
        ] as [Cursor, Cursor] | [number, number]);
        const newValue = fn(
          currentValue as InferRefType<TDoc, TPath>,
          this.#getContext()
        ) as string | undefined;

        if (newValue !== undefined) {
          // Replace the range
          let start: number;
          let end: number;

          if (this.range[KIND] === "range") {
            start = this.range.start;
            end = this.range.end;
          } else {
            // stable_range - resolve cursors
            const positions = this.#resolveCursorRange(
              doc,
              this.path,
              this.range.start,
              this.range.end
            );
            if (!positions) {
              throw new Error("Cannot resolve cursor positions");
            }
            [start, end] = positions;
          }

          const propPath = this.#getPropPath(this.path, "throw")!;
          const deleteCount = end - start;
          Automerge.splice(doc, propPath, start, deleteCount, newValue);
        }
        return;
      }

      // Normal path change
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

  #getContext(): RefContext {
    return (this.#ctx ??= {
      splice: (index: number, deleteCount: number, insert?: string) => {
        this.docHandle.change((doc: Doc<TDoc>) => {
          const propPath = this.#getPropPath(this.path, "throw")!;
          Automerge.splice(doc, propPath, index, deleteCount, insert);
        });
      },
      updateText: (newValue: string) => {
        this.docHandle.change((doc: Doc<TDoc>) => {
          const propPath = this.#getPropPath(this.path, "throw")!;
          Automerge.updateText(doc, propPath, newValue);
        });
      },
    });
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

  #traverse(container: any, path: PathSegment[], range?: RangeSegment): any {
    let current = container;

    // Traverse path segments
    for (const segment of path) {
      if (current === undefined || current === null) {
        return undefined;
      }

      // All path segments use resolvedProp
      if (segment.resolvedProp === undefined) {
        return undefined;
      }

      current = current[segment.resolvedProp];
    }

    // If there's a range, extract substring
    if (range) {
      return this.#getRange(current, [range.start, range.end] as
        | [Cursor, Cursor]
        | [number, number]);
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
    // this.path now doesn't include the range, so use it directly
    const positions = this.#resolveCursorRange(
      doc,
      this.path,
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
    path: PathSegment[],
    startCursor: Cursor,
    endCursor: Cursor
  ): [number, number] | undefined {
    const propPath = this.#getPropPath(path, "full");
    if (!propPath) return undefined;

    const start = Automerge.getCursorPosition(doc, propPath, startCursor);
    const end = Automerge.getCursorPosition(doc, propPath, endCursor);

    if (start === undefined || end === undefined) return undefined;
    return [start, end];
  }

  #setValue(doc: any, path: PathSegment[], value: any): void {
    if (path.length === 0) {
      throw new Error("Cannot replace root document");
    }

    const parentPath = path.slice(0, -1);
    const lastSegment = path[path.length - 1];
    const parent = this.#traverse(doc, parentPath);

    if (!parent) {
      throw new Error("Cannot set value: parent is undefined");
    }

    // PathSegments always have resolvedProp (key/index/stable_index/query)
    if (lastSegment.resolvedProp === undefined) {
      throw new Error("Cannot set value: segment is unresolved");
    }

    parent[lastSegment.resolvedProp] = value;
  }

  #patchAffectsRef(patches: Automerge.Patch[]): boolean {
    // Get the best-effort prop path (stops at first unresolved segment)
    // Props are already up-to-date from the internal change listener
    const refPropPath = this.#getPropPath(this.path, "best-effort")!;

    // If we couldn't resolve any part, ref was never valid - don't fire
    if (refPropPath.length === 0) return false;

    return patches.some((patch) => this.#pathsOverlap(patch.path, refPropPath));
  }

  /**
   * Get Automerge prop path from path segments.
   *
   * Modes:
   * - "throw": Throws if any segment is unresolved (for mutations)
   * - "full": Returns undefined if any segment is unresolved (for queries)
   * - "best-effort": Returns partial path, stopping at first unresolved (for onChange)
   */
  #getPropPath(
    segments: PathSegment[] = this.path,
    mode: "throw" | "full" | "best-effort" = "full"
  ): Prop[] | undefined {
    const props: Prop[] = [];

    for (const segment of segments) {
      if (segment.resolvedProp === undefined) {
        if (mode === "throw") {
          throw new Error(
            "Cannot resolve path: one or more segments are unresolved"
          );
        }
        if (mode === "best-effort") {
          break; // Return partial path
        }
        return undefined; // mode === "full"
      }

      props.push(segment.resolvedProp);
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
