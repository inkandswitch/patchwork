import * as Automerge from "@automerge/automerge";
import type { DocHandle } from "@automerge/automerge-repo";
import type {
  PathSegment,
  RefOptions,
  ChangeCallback,
  PathBuilder,
  DynamicSegment,
} from "./types";

/**
 * A reference to a location in an Automerge document.
 *
 * Refs are stable by default - numeric indices and where clauses
 * resolve to Automerge ObjectIds. Use `at()` for dynamic/unstable refs.
 */
export class Ref<T = any> {
  // Public properties
  readonly docHandle: DocHandle<any>;
  readonly path: PathSegment[];
  readonly options: RefOptions;

  constructor(
    docHandle: DocHandle<any>,
    path: PathSegment[],
    options: RefOptions = {}
  ) {
    this.docHandle = docHandle;
    this.path = path;
    this.options = options;
  }

  // ---- Public API ----

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
    const doc = this.docHandle.docSync();
    if (!doc) throw new Error("Document not loaded");
    return this.options.heads ? Automerge.view(doc, this.options.heads) : doc;
  }

  /**
   * Mutate the value at this ref's location.
   *
   * For objects/arrays: mutate in place (return void)
   * For primitives: return the new value
   */
  change(fn: (val: T) => void | T): void {
    if (this.options.heads) {
      throw new Error("Cannot change a Ref pinned to specific heads");
    }

    this.docHandle.change((doc) => {
      const currentValue = this.#resolve(doc);
      const newValue = fn(currentValue as T);

      // If a value is returned, replace at path
      if (newValue !== undefined) {
        this.#setAtPath(doc, this.path, newValue);
      }
    });
  }

  /**
   * Subscribe to changes that affect this ref's target.
   */
  on(event: "change", callback: ChangeCallback): void {
    if (event !== "change") return;

    this.docHandle.on("change", ({ doc, patches, patchInfo }) => {
      if (this.#patchAffectsRef(patches)) {
        callback({ doc, patches, patchInfo });
      }
    });
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
      return this.#resolveRange(container, segment as [Automerge.Cursor, Automerge.Cursor] | [number, number]);
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

    return container.find((item) => {
      for (const [key, value] of Object.entries(clause)) {
        if (item[key] !== value) return false;
      }
      return true;
    });
  }

  /**
   * Resolve a range (returns substring or subarray).
   */
  #resolveRange(
    text: string,
    range: [Automerge.Cursor, Automerge.Cursor] | [number, number]
  ): string {
    if (!Array.isArray(range) || range.length !== 2) return "";

    // Numeric range - simple slice
    if (typeof range[0] === "number") {
      const [start, end] = range as [number, number];
      return text.slice(start, end);
    }

    // Cursor-based range - TODO: implement cursor resolution
    // For now, return empty string
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
   */
  #patchAffectsRef(patches: Automerge.Patch[]): boolean {
    // TODO: Implement proper patch path matching
    // For now, return true for all patches (conservative)
    return patches.length > 0;
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
    if (Array.isArray(segment)) {
      const [start, end] = segment;
      // Check if cursors (objects) or numbers
      if (typeof start === "object") {
        return `[$${start},$${end}]`;
      }
      return `[${start},${end}]`;
    }

    // Where clause - serialize as JSON for now
    return JSON.stringify(segment);
  }
}
