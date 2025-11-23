import * as Automerge from "@automerge/automerge";
import type {
  DocHandle,
  DocHandleChangePayload,
} from "@automerge/automerge-repo";
import type { PathSegment, PathInput, RefOptions, RefContext } from "./types";
import { QUERY, ID } from "./types";
import {
  isNumericRange,
  isCursorRange,
  isPathSegment,
  isPlainObject,
} from "./guards";
import {
  matchesWhereClause,
  findIndexByObjectId,
  findIndexByWhereClause,
} from "./utils";

/**
 * A reference to a location in an Automerge document.
 *
 * Refs are stable by default - numeric indices and where clauses
 * automatically resolve to Automerge ObjectIds. Use `at()` for dynamic/unstable refs.
 */
export class Ref<T = any> {
  // Public properties
  readonly docHandle: DocHandle<any>;
  readonly path: PathSegment[];
  readonly options: RefOptions;

  // Private properties
  #ctx?: RefContext;

  constructor(
    docHandle: DocHandle<any>,
    segments: PathInput[],
    options?: RefOptions
  );
  constructor(
    docHandle: DocHandle<any>,
    segments: PathSegment[],
    options: RefOptions,
    skipStabilization: true
  );
  constructor(
    docHandle: DocHandle<any>,
    segments: PathInput[] | PathSegment[],
    options: RefOptions = {},
    skipStabilization = false
  ) {
    this.docHandle = docHandle;
    this.options = options;

    if (skipStabilization) {
      // Path segments are already parsed (from URL parsing)
      this.path = segments as PathSegment[];
    } else {
      // Normalize and stabilize segments on construction
      const doc = docHandle.doc();
      this.path = this.#buildStablePath(doc, segments as PathInput[]);
    }
  }

  /**
   * Create a Ref from a URL path and optional heads string.
   *
   * This is used internally by findRef() to parse URL components.
   *
   * @param handle - The document handle
   * @param pathStr - The path string from the URL (e.g., "todos/$abc/title")
   * @param headsStr - Optional comma-separated heads string
   * @returns A new Ref instance
   *
   * @example
   * ```ts
   * const ref = Ref.fromUrl(handle, "todos/$abc/title", "head1,head2");
   * ```
   */
  static fromUrl<T = any>(
    handle: DocHandle<any>,
    pathStr: string,
    headsStr?: string
  ): Ref<T> {
    // Parse path segments (already stable from URL)
    const path = pathStr ? Ref.#parsePathSegments(pathStr) : [];

    // Parse heads if present
    const options: RefOptions = {};
    if (headsStr) {
      options.heads = headsStr.split(",");
    }

    // Create ref with pre-parsed stable path segments using private overload
    return new Ref<T>(handle, path, options, true);
  }

  /**
   * Parse a serialized path string back into PathSegments.
   * @internal
   */
  static #parsePathSegments(pathStr: string): PathSegment[] {
    if (!pathStr || pathStr === "/") return [];

    return pathStr.split("/").map((segment): PathSegment => {
      if (!segment) {
        throw new Error("Invalid path: empty segment");
      }
      return this.#parseSegment(segment);
    });
  }

  /**
   * Parse a single path segment from URL format.
   * @internal
   */
  static #parseSegment(segment: string): PathSegment {
    // ObjectId: $abc123
    if (segment.startsWith("$")) {
      return { [ID]: segment.slice(1) };
    }

    // Range: [start,end] or [$cursor1,$cursor2]
    if (segment.startsWith("[")) {
      return this.#parseRange(segment);
    }

    // JSON/where clause: {"key":"value"}
    if (segment.startsWith("{")) {
      return this.#parseJsonSegment(segment);
    }

    // Numeric index: 0, 1, 42
    if (/^\d+$/.test(segment)) {
      return { [QUERY]: parseInt(segment, 10) };
    }

    // String property: name, title, etc
    return { [QUERY]: segment };
  }

  /**
   * Parse a range segment: [start,end] or [$cursor1,$cursor2].
   * @internal
   */
  static #parseRange(segment: string): PathSegment {
    const content = segment.slice(1, -1);
    const parts = content.split(",");

    if (parts.length !== 2) {
      throw new Error(`Invalid range: ${segment}`);
    }

    const [first, second] = parts;

    // Cursor range: [$cursor1,$cursor2]
    if (first.startsWith("$") && second.startsWith("$")) {
      return {
        [ID]: [
          first.slice(1) as Automerge.Cursor,
          second.slice(1) as Automerge.Cursor,
        ],
      };
    }

    // Numeric range: [0,10]
    const start = parseInt(first, 10);
    const end = parseInt(second, 10);

    if (isNaN(start) || isNaN(end)) {
      throw new Error(`Invalid numeric range: ${segment}`);
    }

    return { [QUERY]: [start, end] };
  }

  /**
   * Parse a JSON segment (where clause).
   * @internal
   */
  static #parseJsonSegment(segment: string): PathSegment {
    try {
      const parsed = JSON.parse(segment);
      return { [QUERY]: parsed };
    } catch (e) {
      throw new Error(`Invalid JSON segment: ${segment}`);
    }
  }

  // ---- Public API ----

  /**
   * Get the context object for text mutation helpers.
   * Created lazily on first access.
   */
  get ctx(): RefContext {
    if (!this.#ctx) {
      this.#ctx = this.#createContext();
    }
    return this.#ctx;
  }

  /**
   * Get the current value at this ref's location.
   * Returns undefined if the path cannot be resolved.
   */
  value(): T | undefined {
    const doc = this.doc();
    if (!doc) return undefined;
    return this.#resolve(doc);
  }

  /**
   * Get the document (or a view at specific heads).
   */
  doc(): Automerge.Doc<any> {
    const doc = this.docHandle.doc();
    if (!doc) throw new Error("Document not loaded");
    return this.options.heads ? Automerge.view(doc, this.options.heads) : doc;
  }

  /**
   * Mutate the value at this ref's location.
   *
   * For objects/arrays: mutate in place (return void)
   * For primitives: return the new value
   */
  change(fn: (val: T, ctx: RefContext) => void | T): void {
    if (this.options.heads) {
      throw new Error("Cannot change a Ref pinned to specific heads");
    }

    this.docHandle.change((doc) => {
      const currentValue = this.#resolve(doc);
      const newValue = fn(currentValue as T, this.ctx);

      // If a value is returned, replace at path
      if (newValue !== undefined) {
        this.#setAtPath(doc, this.path, newValue);
      }
    });
  }

  /**
   * Subscribe to changes that affect this ref's target.
   * Returns an unsubscribe function.
   */
  on(
    event: "change",
    callback: (payload: DocHandleChangePayload<any>) => void
  ): () => void {
    const wrappedCallback = (payload: DocHandleChangePayload<any>) => {
      if (this.#patchAffectsRef(payload.patches)) {
        callback(payload);
      }
    };

    // Subscribe to docHandle changes
    this.docHandle.on(event, wrappedCallback);

    // Return unsubscribe function
    return () => {
      this.docHandle.off(event, wrappedCallback);
    };
  }

  /**
   * Get the canonical URI for this ref.
   */
  get url(): string {
    const docId = this.docHandle.documentId;
    const pathStr = this.path
      .map((seg) => this.#serializeSegment(seg))
      .join("/");
    const headsStr = this.options.heads
      ? `#${this.options.heads.join(",")}`
      : "";
    return `automerge:${docId}/${pathStr}${headsStr}`;
  }

  /**
   * Check equality with another ref.
   */
  equals(other: Ref<any>): boolean {
    return this.url === other.url;
  }

  /**
   * Value object equality (enables ref == other).
   */
  valueOf(): string {
    return this.url;
  }

  /**
   * String representation.
   */
  toString(): string {
    return this.url;
  }

  // ---- Private Methods ----

  /**
   * Build a stable path from PathInput segments.
   * Normalizes inputs and stabilizes what can be stabilized.
   */
  #buildStablePath(
    doc: Automerge.Doc<any>,
    inputs: PathInput[]
  ): PathSegment[] {
    const path: PathSegment[] = [];
    let currentPath: PathSegment[] = [];

    for (const input of inputs) {
      let segment: PathSegment;

      // Check if already a PathSegment (from at())
      if (isPathSegment(input)) {
        // Already wrapped - keep as-is (no stabilization)
        segment = input;
      } else {
        // Raw input - try to stabilize
        const id = this.#tryStabilize(
          doc,
          currentPath,
          input as Exclude<PathInput, PathSegment>
        );
        segment = {
          [QUERY]: input as Exclude<PathInput, PathSegment>,
          [ID]: id,
        };
      }

      path.push(segment);
      currentPath.push(segment);
    }

    return path;
  }

  /**
   * Try to stabilize a path input to a stable reference.
   * Returns ObjectId string, cursor pair, or undefined if can't stabilize.
   * Throws if stabilization is expected but fails.
   */
  #tryStabilize(
    doc: Automerge.Doc<any>,
    currentPath: PathSegment[],
    input: Exclude<PathInput, PathSegment>
  ): string | [Automerge.Cursor, Automerge.Cursor] | undefined {
    // String property - no stabilization mechanism (yet)
    // Just leave unstable for now
    if (typeof input === "string") {
      return undefined;
    }

    // Numeric index - resolve to ObjectId
    if (typeof input === "number") {
      return this.#stabilizeNumericIndex(doc, currentPath, input);
    }

    // Range [start, end] - convert to cursors
    if (Array.isArray(input) && input.length === 2) {
      return this.#stabilizeRange(doc, currentPath, input as [number, number]);
    }

    // Plain object - where clause
    if (isPlainObject(input)) {
      return this.#stabilizeWhereClause(doc, currentPath, input);
    }

    throw new Error(
      `Unsupported path input type: ${typeof input}. ` +
        `Expected string, number, plain object, or array.`
    );
  }

  /**
   * Stabilize a numeric index by finding the object and extracting its ObjectId.
   * Returns undefined if item is a primitive (auto-fallback to unstable).
   * Never throws - returns undefined if stabilization isn't possible.
   */
  #stabilizeNumericIndex(
    doc: Automerge.Doc<any>,
    currentPath: PathSegment[],
    index: number
  ): string | undefined {
    return this.#stabilizeArrayItem(doc, currentPath, (arr) => arr[index]);
  }

  /**
   * Stabilize a where clause by finding the matching object and extracting its ObjectId.
   * Returns undefined if item is a primitive (auto-fallback to unstable).
   * Never throws - returns undefined if stabilization isn't possible.
   */
  #stabilizeWhereClause(
    doc: Automerge.Doc<any>,
    currentPath: PathSegment[],
    clause: Record<string, any>
  ): string | undefined {
    return this.#stabilizeArrayItem(doc, currentPath, (arr) =>
      arr.find((obj) => matchesWhereClause(obj, clause))
    );
  }

  /**
   * Common logic for stabilizing array items to ObjectIds.
   * Extracts the pattern shared by numeric index and where clause stabilization.
   */
  #stabilizeArrayItem(
    doc: Automerge.Doc<any>,
    currentPath: PathSegment[],
    findItem: (arr: any[]) => any
  ): string | undefined {
    const container = this.#resolvePath(doc, currentPath);
    if (!Array.isArray(container)) return undefined;

    const item = findItem(container);
    if (!item) return undefined;

    // Try to get ObjectId - if it's a primitive, stay unstable
    // TODO: Investigate stable identifiers for primitive arrays (e.g., array cursors)
    return Automerge.getObjectId(item) || undefined;
  }

  /**
   * Stabilize a range by converting numeric indices to Automerge cursors.
   * This makes ranges stable across text edits (insertions/deletions).
   * Never throws - returns undefined if stabilization isn't possible.
   */
  #stabilizeRange(
    doc: Automerge.Doc<any>,
    currentPath: PathSegment[],
    range: [number, number]
  ): [Automerge.Cursor, Automerge.Cursor] | undefined {
    const [start, end] = range;

    // Resolve to the text container
    const container = this.#resolvePath(doc, currentPath);

    // Check if it's a text object (string)
    if (typeof container !== "string") {
      // Not text - stay unstable
      return undefined;
    }

    try {
      // Convert currentPath to Automerge.Prop[] (only string/number segments)
      const propPath = this.#pathToPropPath(doc, currentPath);

      // Create cursors at the positions
      const startCursor = Automerge.getCursor(doc, propPath, start);
      const endCursor = Automerge.getCursor(doc, propPath, end);

      return [startCursor, endCursor];
    } catch (e) {
      // Failed to get cursors - stay unstable
      return undefined;
    }
  }

  /**
   * Convert a PathSegment[] to Automerge.Prop[] by resolving ObjectIds and where clauses to indices.
   *
   * @param doc - The Automerge document
   * @param path - The path segments to convert
   * @param allowRanges - Whether to allow range segments (default: false)
   * @returns The resolved property path
   */
  #pathToPropPath(
    doc: Automerge.Doc<any>,
    path: PathSegment[],
    allowRanges = false
  ): Automerge.Prop[] {
    const propPath: Automerge.Prop[] = [];
    let current = doc;

    for (const segment of path) {
      if (current === undefined || current === null) {
        throw new Error(
          "Cannot resolve path: traversal reached null/undefined"
        );
      }

      const prop = this.#segmentToProp(current, segment, allowRanges);
      propPath.push(prop);
      current = current[prop];
    }

    return propPath;
  }

  /**
   * Convert a single PathSegment to an Automerge.Prop (string or number).
   * Helper for #pathToPropPath.
   */
  #segmentToProp(
    current: any,
    segment: PathSegment,
    allowRanges: boolean
  ): Automerge.Prop {
    const id = segment[ID];
    const query = segment[QUERY];

    // Try stable reference first
    if (id !== undefined) {
      if (typeof id === "string") {
        // ObjectId - find current index
        if (!Array.isArray(current)) {
          throw new Error("ObjectId segment requires array container");
        }
        const index = findIndexByObjectId(current, id);
        if (index === -1) {
          throw new Error(`ObjectId not found: ${id}`);
        }
        return index;
      }

      // Cursor range - can't be in prop path
      if (!allowRanges) {
        throw new Error("Cannot resolve through a range segment");
      }
      throw new Error("Range segments cannot be part of a property path");
    }

    // No stable reference, must use query
    if (query === undefined) {
      throw new Error("PathSegment has neither ID nor QUERY");
    }

    // Direct property
    if (typeof query === "string" || typeof query === "number") {
      return query;
    }

    // Numeric range
    if (Array.isArray(query)) {
      if (!allowRanges) {
        throw new Error("Cannot resolve through a range segment");
      }
      throw new Error("Range segments cannot be part of a property path");
    }

    // Where clause - find index
    if (!Array.isArray(current)) {
      throw new Error("Where clause requires array container");
    }
    const index = findIndexByWhereClause(current, query);
    if (index === -1) {
      throw new Error(`No item matches where clause: ${JSON.stringify(query)}`);
    }
    return index;
  }

  /**
   * Create the context object for text mutation helpers.
   * Builds the actual Automerge.Prop[] path by resolving PathSegments.
   */
  #createContext(): RefContext {
    const self = this;
    return {
      splice(index: number, deleteCount: number, insert?: string): void {
        self.docHandle.change((doc) => {
          const resolvedPath = self.#pathToPropPath(doc, self.path);
          Automerge.splice(doc, resolvedPath, index, deleteCount, insert);
        });
      },
      updateText(newValue: string): void {
        self.docHandle.change((doc) => {
          const resolvedPath = self.#pathToPropPath(doc, self.path);
          Automerge.updateText(doc, resolvedPath, newValue);
        });
      },
    };
  }

  /**
   * Resolve the full path to get the target value.
   */
  #resolve(doc: Automerge.Doc<any>): T | undefined {
    return this.#resolvePath(doc, this.path);
  }

  /**
   * Traverse a path to resolve a value.
   */
  #resolvePath(doc: any, path: PathSegment[]): any {
    let current = doc;

    for (const segment of path) {
      if (current === undefined || current === null) {
        return undefined;
      }

      current = this.#resolveSegment(current, segment);
    }

    return current;
  }

  /**
   * Resolve a single path segment.
   */
  #resolveSegment(container: any, segment: PathSegment): any {
    const id = segment[ID];
    const query = segment[QUERY];

    // Try stable reference first
    if (id !== undefined) {
      return typeof id === "string"
        ? this.#resolveObjectId(container, id)
        : this.#resolveRange(container, id);
    }

    // No stable reference, must use query
    if (query === undefined) return undefined;

    // Direct property access
    if (typeof query === "string" || typeof query === "number") {
      return container[query];
    }

    // Range or where clause
    return Array.isArray(query)
      ? this.#resolveRange(container, query as [number, number])
      : this.#resolveWhereClause(container, query);
  }

  /**
   * Find an object in an array by its Automerge ObjectId.
   */
  #resolveObjectId(container: any[], objectId: string): any {
    if (!Array.isArray(container)) return undefined;
    return container.find((item) => Automerge.getObjectId(item) === objectId);
  }

  /**
   * Find an object in an array matching a where clause.
   */
  #resolveWhereClause(container: any[], clause: Record<string, any>): any {
    if (!Array.isArray(container)) return undefined;
    return container.find((item) => matchesWhereClause(item, clause));
  }

  /**
   * Resolve a range (returns substring or subarray).
   */
  #resolveRange(
    text: string,
    range: [Automerge.Cursor, Automerge.Cursor] | [number, number]
  ): string {
    // Numeric range - simple slice
    if (isNumericRange(range)) {
      return text.slice(range[0], range[1]);
    }

    // Cursor-based range - resolve cursor positions
    if (isCursorRange(range)) {
      try {
        const doc = this.doc();
        // Get the path to the text (excluding the range segment itself)
        const textPath = this.path.slice(0, -1);
        const propPath = this.#pathToPropPath(doc, textPath);

        const start = Automerge.getCursorPosition(doc, propPath, range[0]);
        const end = Automerge.getCursorPosition(doc, propPath, range[1]);

        if (start === undefined || end === undefined) return "";
        return text.slice(start, end);
      } catch (e) {
        return "";
      }
    }

    return "";
  }

  /**
   * Set a value at a path.
   */
  #setAtPath(doc: any, path: PathSegment[], value: any): void {
    if (path.length === 0) {
      throw new Error("Cannot replace root document");
    }

    const parentPath = path.slice(0, -1);
    const lastSegment = path[path.length - 1];
    const parent = this.#resolvePath(doc, parentPath);

    if (!parent) {
      throw new Error("Cannot set value: parent is undefined");
    }

    // Extract the property key from the segment
    const query = lastSegment[QUERY];
    if (typeof query === "string" || typeof query === "number") {
      parent[query] = value;
    } else {
      throw new Error(
        "Cannot set value: last segment must be a property name or index"
      );
    }
  }

  /**
   * Check if any patch affects this ref's target.
   * A patch affects the ref if its path matches or is a prefix of the ref's path.
   */
  #patchAffectsRef(patches: Automerge.Patch[]): boolean {
    // Convert ref path to prop path for comparison
    const doc = this.doc();
    if (!doc) return false;

    try {
      // Get the path to the target (excluding ranges which are not part of the path hierarchy)
      const refPathSegments = this.path.filter(
        (seg) =>
          !Array.isArray(seg) || !seg.length || typeof seg[0] !== "number"
      );
      const refPropPath = this.#pathToPropPath(doc, refPathSegments);

      // Check each patch
      for (const patch of patches) {
        if (this.#pathMatchesRef(patch.path, refPropPath)) {
          return true;
        }
      }

      return false;
    } catch (e) {
      // If we can't resolve the path, conservatively return true
      return patches.length > 0;
    }
  }

  /**
   * Check if a patch path matches or is a prefix of the ref's path.
   * For example:
   * - patch ["counter"] matches ref ["counter"]
   * - patch ["user", "profile", "name"] matches ref ["user", "profile", "name"]
   * - patch ["user", "profile", "name"] does NOT match ref ["counter"]
   * - patch ["user", "profile", "age"] does NOT match ref ["user", "profile", "name"]
   */
  #pathMatchesRef(
    patchPath: Automerge.Prop[],
    refPropPath: Automerge.Prop[]
  ): boolean {
    // The patch path must be a prefix of or equal to the ref path
    // OR the ref path must be a prefix of the patch path (parent changed)
    const minLength = Math.min(patchPath.length, refPropPath.length);

    for (let i = 0; i < minLength; i++) {
      if (patchPath[i] !== refPropPath[i]) {
        return false;
      }
    }

    // If we got here, one path is a prefix of the other
    return true;
  }

  /**
   * Serialize a path segment to a URI component.
   */
  #serializeSegment(segment: PathSegment): string {
    const id = segment[ID];
    const query = segment[QUERY];

    // Prefer stable reference if available
    if (id !== undefined) {
      if (typeof id === "string") {
        return `$${id}`;
      }
      // Cursor range
      const [start, end] = id;
      return `[$${start},$${end}]`;
    }

    // No stable reference, use query
    if (query === undefined) {
      throw new Error("PathSegment has neither ID nor QUERY to serialize");
    }

    // Direct property
    if (typeof query === "string" || typeof query === "number") {
      return String(query);
    }

    // Numeric range
    if (isNumericRange(query)) {
      return `[${query[0]},${query[1]}]`;
    }

    // Where clause - serialize as JSON
    return JSON.stringify(query);
  }
}

/**
 * Create a ref to a location in an Automerge document.
 *
 * This is a convenience wrapper around `new Ref()` that accepts
 * variadic arguments instead of an array.
 *
 * Refs are stable by default:
 * - Numeric indices resolve to ObjectIds
 * - Where clauses resolve to ObjectIds
 * - Ranges convert to cursors
 *
 * Use `at()` to create dynamic/unstable refs.
 *
 * @example
 * ```ts
 * // Stable refs (survive reordering)
 * ref(handle, 'todos', 0, 'title')
 * ref(handle, 'todos', { id: 'abc' }, 'done')
 *
 * // Dynamic refs (positional)
 * ref(handle, 'todos', at(0), 'title')
 * ```
 */
export function ref<T = any>(
  docHandle: DocHandle<any>,
  ...segments: PathInput[]
): Ref<T> {
  return new Ref<T>(docHandle, segments);
}
