import * as Automerge from "@automerge/automerge";
import type { DocHandle } from "@automerge/automerge-repo";
import type {
  PathSegment,
  RefOptions,
  ChangeCallback,
  PathBuilder,
  RefContext,
} from "./types";
import { isNumericRange, isCursorRange, isDynamic } from "./guards";

// TODO: consider a value getter

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
    segments: PathBuilder[],
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
    segments: PathBuilder[] | PathSegment[],
    options: RefOptions = {},
    skipStabilization = false
  ) {
    this.docHandle = docHandle;
    this.options = options;

    if (skipStabilization) {
      // Path segments are already stable (from URL parsing)
      this.path = segments as PathSegment[];
    } else {
      // Auto-stabilize segments on construction
      const doc = docHandle.doc();
      this.path = this.#buildStablePath(doc, segments as PathBuilder[]);
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
      options.heads = headsStr.split(",") as Automerge.Heads;
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
      // Empty segment
      if (!segment) {
        throw new Error("Invalid path: empty segment");
      }

      // ObjectId or Cursor: $abc123
      // NOTE: Both ObjectIds and Cursors have the same format (e.g., "2@abc...")
      // Cursors are ONLY used in ranges [cursor1,cursor2]
      // So a standalone $... is always an ObjectId
      if (segment.startsWith("$")) {
        const id = segment.slice(1);
        return { $id: id };
      }

      // Range: [start,end] or [$cursor1,$cursor2]
      if (segment.startsWith("[") && segment.endsWith("]")) {
        const rangeContent = segment.slice(1, -1);
        const parts = rangeContent.split(",");

        if (parts.length !== 2) {
          throw new Error(`Invalid range: ${segment}`);
        }

        // Cursor range: [$cursor1,$cursor2]
        if (parts[0].startsWith("$") && parts[1].startsWith("$")) {
          return [
            parts[0].slice(1) as Automerge.Cursor,
            parts[1].slice(1) as Automerge.Cursor,
          ];
        }

        // Numeric range: [0,10]
        const start = parseInt(parts[0], 10);
        const end = parseInt(parts[1], 10);
        if (isNaN(start) || isNaN(end)) {
          throw new Error(`Invalid numeric range: ${segment}`);
        }
        return [start, end];
      }

      // Where clause or object: {...}
      if (segment.startsWith("{") && segment.endsWith("}")) {
        try {
          return JSON.parse(segment);
        } catch (e) {
          throw new Error(`Invalid JSON segment: ${segment}`);
        }
      }

      // Number: just digits
      if (/^\d+$/.test(segment)) {
        return parseInt(segment, 10);
      }

      // String property: everything else
      return segment;
    });
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
  on(event: "change", callback: ChangeCallback): () => void {
    if (event !== "change") return () => {};

    const wrappedCallback = ({ doc, patches, patchInfo }: any) => {
      if (this.#patchAffectsRef(patches)) {
        callback({ doc, patches, patchInfo });
      }
    };

    // Subscribe to docHandle changes
    this.docHandle.on("change", wrappedCallback);

    // Return unsubscribe function
    return () => {
      this.docHandle.off("change", wrappedCallback);
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
   * Check if an item matches a where clause.
   */
  #matchesWhereClause(item: any, clause: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(clause)) {
      if (item[key] !== value) return false;
    }
    return true;
  }

  /**
   * Find the index of an item in an array by its ObjectId.
   * Returns -1 if not found.
   */
  #findIndexByObjectId(array: any[], objectId: string): number {
    return array.findIndex((item) => Automerge.getObjectId(item) === objectId);
  }

  /**
   * Find the index of an item in an array matching a where clause.
   * Returns -1 if not found.
   */
  #findIndexByWhereClause(array: any[], clause: Record<string, any>): number {
    return array.findIndex((item) => this.#matchesWhereClause(item, clause));
  }

  /**
   * Build a stable path from PathBuilder segments.
   * Stabilizes numeric indices and where clauses to ObjectIds.
   */
  #buildStablePath(
    doc: Automerge.Doc<any>,
    segments: PathBuilder[]
  ): PathSegment[] {
    const path: PathSegment[] = [];
    let currentPath: PathSegment[] = [];

    for (const segment of segments) {
      // Check if wrapped in at() (dynamic marker)
      if (isDynamic(segment)) {
        // Dynamic segment - use as-is without stabilization
        path.push(segment.value);
        currentPath.push(segment.value);
        continue;
      }

      // Stabilize the segment
      const stabilized = this.#stabilizeSegment(doc, currentPath, segment);
      path.push(stabilized);
      currentPath.push(stabilized);
    }

    return path;
  }

  /**
   * Stabilize a single segment by resolving to ObjectIds or cursors.
   */
  #stabilizeSegment(
    doc: Automerge.Doc<any>,
    currentPath: PathSegment[],
    segment: PathBuilder
  ): PathSegment {
    // String property - always stable as-is
    if (typeof segment === "string") {
      return segment;
    }

    // Numeric index - resolve to ObjectId
    if (typeof segment === "number") {
      return this.#stabilizeNumericIndex(doc, currentPath, segment);
    }

    // Range [start, end] - convert to cursors
    if (Array.isArray(segment) && segment.length === 2) {
      return this.#stabilizeRange(
        doc,
        currentPath,
        segment as [number, number]
      );
    }

    // Plain object - could be where clause or Automerge object reference
    if (typeof segment === "object" && segment !== null) {
      // Check if it's a plain object (where clause) vs Automerge proxy
      if (segment.constructor === Object) {
        // Plain object - treat as where clause, resolve to ObjectId
        return this.#stabilizeWhereClause(doc, currentPath, segment);
      }

      // It's an Automerge object reference - extract its ObjectId
      const objectId = Automerge.getObjectId(segment);
      if (objectId) {
        return { $id: objectId };
      }
    }

    // Fallback - return as-is
    return segment as PathSegment;
  }

  /**
   * Stabilize a numeric index by finding the object and extracting its ObjectId.
   */
  #stabilizeNumericIndex(
    doc: Automerge.Doc<any>,
    currentPath: PathSegment[],
    index: number
  ): PathSegment {
    const container = this.#resolvePath(doc, currentPath);

    if (!Array.isArray(container)) {
      // Not an array - return the index as-is
      return index;
    }

    const item = container[index];
    if (item === undefined) {
      // Out of bounds - return index as-is
      return index;
    }

    // Try to get ObjectId
    const objectId = Automerge.getObjectId(item);
    if (objectId) {
      return { $id: objectId };
    }

    // Item is a primitive or doesn't have an ObjectId - return index
    return index;
  }

  /**
   * Stabilize a where clause by finding the matching object and extracting its ObjectId.
   */
  #stabilizeWhereClause(
    doc: Automerge.Doc<any>,
    currentPath: PathSegment[],
    clause: Record<string, any>
  ): PathSegment {
    const container = this.#resolvePath(doc, currentPath);

    if (!Array.isArray(container)) {
      // Not an array - return clause as-is
      return clause;
    }

    // Find matching item using helper
    const item = container.find((obj) => this.#matchesWhereClause(obj, clause));

    if (!item) {
      // No match - return clause as-is (will fail at resolution time)
      return clause;
    }

    // Try to get ObjectId
    const objectId = Automerge.getObjectId(item);
    if (objectId) {
      return { $id: objectId };
    }

    // Item doesn't have ObjectId - return clause as-is
    return clause;
  }

  /**
   * Stabilize a range by converting numeric indices to Automerge cursors.
   * This makes ranges stable across text edits (insertions/deletions).
   */
  #stabilizeRange(
    doc: Automerge.Doc<any>,
    currentPath: PathSegment[],
    range: [number, number]
  ): PathSegment {
    const [start, end] = range;

    // Resolve to the text container
    const container = this.#resolvePath(doc, currentPath);

    // Check if it's a text object (string)
    if (typeof container !== "string") {
      // Not text - return numeric range as-is
      return range;
    }

    try {
      // Convert currentPath to Automerge.Prop[] (only string/number segments)
      const propPath = this.#pathToPropPath(doc, currentPath);

      // Create cursors at the positions
      const startCursor = Automerge.getCursor(doc, propPath, start);
      const endCursor = Automerge.getCursor(doc, propPath, end);

      return [startCursor, endCursor];
    } catch (e) {
      // Failed to get cursors - return numeric range as fallback
      return range;
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
      // Check for null/undefined during traversal
      if (current === undefined || current === null) {
        throw new Error(
          "Cannot resolve path: traversal reached null/undefined"
        );
      }

      // String or number: direct property
      if (typeof segment === "string" || typeof segment === "number") {
        propPath.push(segment);
        current = current[segment];
        continue;
      }

      // ObjectId lookup - find its current index in the array using helper
      if (typeof segment === "object" && "$id" in segment) {
        if (!Array.isArray(current)) {
          throw new Error("ObjectId segment requires array container");
        }
        const index = this.#findIndexByObjectId(current, segment.$id);
        if (index === -1) {
          throw new Error(`ObjectId not found: ${segment.$id}`);
        }
        propPath.push(index);
        current = current[index];
        continue;
      }

      // Range - only allowed in some contexts (e.g., cursor operations)
      if (Array.isArray(segment)) {
        if (!allowRanges) {
          throw new Error("Cannot resolve through a range segment");
        }
        // For ranges, we can't continue traversal - they return values not containers
        throw new Error("Range segments cannot be part of a property path");
      }

      // Where clause - find index using helper
      if (!Array.isArray(current)) {
        throw new Error("Where clause requires array container");
      }
      const index = this.#findIndexByWhereClause(current, segment);
      if (index === -1) {
        throw new Error(
          `No item matches where clause: ${JSON.stringify(segment)}`
        );
      }
      propPath.push(index);
      current = current[index];
    }

    return propPath;
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
    return this.#resolvePath(doc, this.path) as T | undefined;
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
    // String or number: direct property access
    if (typeof segment === "string" || typeof segment === "number") {
      return container[segment];
    }

    // ObjectId lookup
    if (typeof segment === "object" && "$id" in segment) {
      return this.#resolveObjectId(container, segment.$id);
    }

    // Range
    if (Array.isArray(segment) && segment.length === 2) {
      return this.#resolveRange(
        container,
        segment as [Automerge.Cursor, Automerge.Cursor] | [number, number]
      );
    }

    // Where clause (Record<string, any>)
    return this.#resolveWhereClause(container, segment);
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
    return container.find((item) => this.#matchesWhereClause(item, clause));
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

    if (
      parent &&
      (typeof lastSegment === "string" || typeof lastSegment === "number")
    ) {
      parent[lastSegment] = value;
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
    // String or number
    if (typeof segment === "string" || typeof segment === "number") {
      return String(segment);
    }

    // ObjectId
    if (typeof segment === "object" && "$id" in segment) {
      return `$${segment.$id}`;
    }

    // Range
    if (isCursorRange(segment)) {
      return `[$${segment[0]},$${segment[1]}]`;
    }

    // Range
    if (isNumericRange(segment)) {
      return `[${segment[0]},${segment[1]}]`;
    }

    // Where clause - serialize as JSON for now
    return JSON.stringify(segment);
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
  ...segments: PathBuilder[]
): Ref<T> {
  return new Ref<T>(docHandle, segments);
}
