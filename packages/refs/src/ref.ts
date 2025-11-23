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
 * Refs are stable by default - they track document objects by ID rather than position,
 * so they remain valid even when the document structure changes.
 *
 * @example
 * ```ts
 * const titleRef = ref(handle, 'todos', 0, 'title');
 * console.log(titleRef.value()); // "Buy milk"
 *
 * titleRef.change(title => title.toUpperCase());
 * console.log(titleRef.value()); // "BUY MILK"
 * ```
 */
export class Ref<T = any> {
  readonly docHandle: DocHandle<any>;
  readonly path: PathSegment[];
  readonly options: RefOptions;

  #ctx?: RefContext;
  #heads?: string[];

  constructor(
    docHandle: DocHandle<any>,
    segments: PathInput[],
    options: RefOptions = {}
  ) {
    this.docHandle = docHandle;
    this.#heads = options.heads;
    this.options = options;

    const doc = docHandle.doc();
    this.path = this.#normalizePath(doc, segments);
  }

  /**
   * The Automerge document heads this ref is pinned to (if any).
   * Setting this creates a view of the document at specific heads.
   */
  set heads(heads: string[] | undefined) {
    this.#heads = heads;
    this.options.heads = heads;
  }

  get heads(): string[] | undefined {
    return this.#heads;
  }

  /**
   * Parse a ref from a URL string.
   */
  static fromUrl<T = any>(
    handle: DocHandle<any>,
    path: string,
    heads?: string
  ): Ref<T> {
    const segments = path ? Ref.#parsePath(path) : [];

    const options: RefOptions = {};
    if (heads) {
      options.heads = heads.split(",");
    }

    return new Ref<T>(handle, segments, options);
  }

  /**
   * Parse a serialized path string back into PathSegments.
   */
  static #parsePath(path: string): PathSegment[] {
    if (!path || path === "/") return [];

    return path.split("/").map((segment): PathSegment => {
      if (!segment) {
        throw new Error("Invalid path: empty segment");
      }
      return this.#parse(segment);
    });
  }

  /**
   * Parse a single path segment from URL format.
   */
  static #parse(segment: string): PathSegment {
    if (segment.startsWith("$")) {
      return { [ID]: segment.slice(1) };
    }

    if (segment.startsWith("[")) {
      return this.#parseRange(segment);
    }

    if (segment.startsWith("{")) {
      return this.#parseJson(segment);
    }

    if (/^\d+$/.test(segment)) {
      return { [QUERY]: parseInt(segment, 10), [ID]: undefined };
    }

    return { [QUERY]: segment, [ID]: undefined };
  }

  /**
   * Parse a range segment.
   */
  static #parseRange(segment: string): PathSegment {
    const content = segment.slice(1, -1);
    const parts = content.split(",");

    if (parts.length !== 2) {
      throw new Error(`Invalid range: ${segment}`);
    }

    const [first, second] = parts;

    if (first.startsWith("$") && second.startsWith("$")) {
      return {
        [ID]: [
          first.slice(1) as Automerge.Cursor,
          second.slice(1) as Automerge.Cursor,
        ],
      };
    }

    const start = parseInt(first, 10);
    const end = parseInt(second, 10);

    if (isNaN(start) || isNaN(end)) {
      throw new Error(`Invalid numeric range: ${segment}`);
    }

    return { [QUERY]: [start, end] };
  }

  /**
   * Parse a JSON segment (where clause).
   */
  static #parseJson(segment: string): PathSegment {
    try {
      const parsed = JSON.parse(segment);
      return { [QUERY]: parsed };
    } catch (e) {
      throw new Error(`Invalid JSON segment: ${segment}`);
    }
  }

  /**
   * Get the context object for text mutation helpers.
   * Created lazily on first access.
   */
  get ctx(): RefContext {
    if (!this.#ctx) {
      this.#ctx = {
        splice: (index: number, deleteCount: number, insert?: string) => {
          this.docHandle.change((doc) => {
            const propPath = this.#toAutomergePath(doc, this.path);
            Automerge.splice(doc, propPath, index, deleteCount, insert);
          });
        },
        updateText: (newValue: string) => {
          this.docHandle.change((doc) => {
            const propPath = this.#toAutomergePath(doc, this.path);
            Automerge.updateText(doc, propPath, newValue);
          });
        },
      };
    }
    return this.#ctx;
  }

  /**
   * Get the current value at this ref's location.
   *
   * @returns The value, or undefined if the path can't be resolved
   */
  value(): T | undefined {
    const doc = this.doc();
    if (!doc) return undefined;
    return this.#traverse(doc, this.path);
  }

  /**
   * Get the Automerge document, or a view at specific heads if set.
   */
  doc(): Automerge.Doc<any> {
    const doc = this.docHandle.doc();
    if (!doc) throw new Error("Document not loaded");
    return this.options.heads ? Automerge.view(doc, this.options.heads) : doc;
  }

  /**
   * Update the value at this ref's location.
   *
   * @example
   * ```ts
   * // Primitives: return new value
   * counterRef.change(n => n + 1);
   *
   * // Objects: mutate in place
   * todoRef.change(todo => { todo.done = true; });
   *
   * // Text: use ctx helpers
   * textRef.change((text, ctx) => ctx.splice(0, 5, "Hello"));
   * ```
   */
  change(fn: (val: T, ctx: RefContext) => void | T): void {
    if (this.options.heads) {
      throw new Error("Cannot change a Ref pinned to specific heads");
    }

    this.docHandle.change((doc) => {
      const currentValue = this.#traverse(doc, this.path);
      const newValue = fn(currentValue as T, this.#getContext());

      if (newValue !== undefined) {
        this.#setValue(doc, this.path, newValue);
      }
    });
  }

  /**
   * Subscribe to changes that affect this ref's value.
   *
   * @returns Unsubscribe function
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

    this.docHandle.on(event, wrappedCallback);

    return () => {
      this.docHandle.off(event, wrappedCallback);
    };
  }

  /**
   * Get the canonical URL for this ref.
   */
  get url(): string {
    const docId = this.docHandle.documentId;
    const pathStr = this.path.map((seg) => this.#serialize(seg)).join("/");
    const headsStr = this.options.heads
      ? `#${this.options.heads.join(",")}`
      : "";
    return `automerge:${docId}/${pathStr}${headsStr}`;
  }

  /**
   * Check if this ref equals another ref (same URL).
   */
  equals(other: Ref<any>): boolean {
    return this.url === other.url;
  }

  /**
   * Get URL string (enables `ref == other` comparisons).
   */
  valueOf(): string {
    return this.url;
  }

  /**
   * Get URL string representation.
   */
  toString(): string {
    return this.url;
  }

  /**
   * Get context object with text mutation helpers.
   */
  #getContext(): RefContext {
    if (!this.#ctx) {
      this.#ctx = {
        splice: (index: number, deleteCount: number, insert?: string) => {
          this.docHandle.change((doc) => {
            const propPath = this.#toAutomergePath(doc, this.path);
            Automerge.splice(doc, propPath, index, deleteCount, insert);
          });
        },
        updateText: (newValue: string) => {
          this.docHandle.change((doc) => {
            const propPath = this.#toAutomergePath(doc, this.path);
            Automerge.updateText(doc, propPath, newValue);
          });
        },
      };
    }
    return this.#ctx;
  }

  /**
   * Normalize path inputs and extract stable IDs where possible.
   * Idempotent - already-complete PathSegments are kept as-is.
   */
  #normalizePath(doc: Automerge.Doc<any>, inputs: PathInput[]): PathSegment[] {
    const result: PathSegment[] = [];
    let currentPath: PathSegment[] = [];

    for (const input of inputs) {
      let segment: PathSegment;

      if (isPathSegment(input)) {
        segment = input;
      } else {
        const id = this.#getStableId(
          doc,
          currentPath,
          input as Exclude<PathInput, PathSegment>
        );
        segment = {
          [QUERY]: input as Exclude<PathInput, PathSegment>,
          [ID]: id,
        };
      }

      result.push(segment);
      currentPath.push(segment);
    }

    return result;
  }

  /** Try to extract a stable ID from a path input. */
  #getStableId(
    doc: Automerge.Doc<any>,
    currentPath: PathSegment[],
    input: Exclude<PathInput, PathSegment>
  ): string | [Automerge.Cursor, Automerge.Cursor] | undefined {
    if (typeof input === "string") {
      return undefined;
    }

    if (typeof input === "number") {
      return this.#getObjectIdAt(doc, currentPath, input);
    }

    if (Array.isArray(input) && input.length === 2) {
      return this.#getCursorsForRange(
        doc,
        currentPath,
        input as [number, number]
      );
    }

    if (isPlainObject(input)) {
      return this.#getObjectIdForWhereClause(doc, currentPath, input);
    }

    throw new Error(
      `Unsupported path input type: ${typeof input}. ` +
        `Expected string, number, plain object, or array.`
    );
  }

  /** Get ObjectId for an array item at a numeric index. */
  #getObjectIdAt(
    doc: Automerge.Doc<any>,
    currentPath: PathSegment[],
    index: number
  ): string | undefined {
    return this.#getObjectIdForItem(doc, currentPath, (arr) => arr[index]);
  }

  /** Get ObjectId for an array item matching a where clause. */
  #getObjectIdForWhereClause(
    doc: Automerge.Doc<any>,
    currentPath: PathSegment[],
    clause: Record<string, any>
  ): string | undefined {
    return this.#getObjectIdForItem(doc, currentPath, (arr) =>
      arr.find((obj) => matchesWhereClause(obj, clause))
    );
  }

  /** Common logic for extracting ObjectIds from array items. */
  #getObjectIdForItem(
    doc: Automerge.Doc<any>,
    currentPath: PathSegment[],
    findItem: (arr: any[]) => any
  ): string | undefined {
    const container = this.#traverse(doc, currentPath);
    if (!Array.isArray(container)) return undefined;

    const item = findItem(container);
    if (!item) return undefined;

    return Automerge.getObjectId(item) || undefined;
  }

  /** Convert a numeric range to Automerge cursors for stability. */
  #getCursorsForRange(
    doc: Automerge.Doc<any>,
    currentPath: PathSegment[],
    range: [number, number]
  ): [Automerge.Cursor, Automerge.Cursor] | undefined {
    const [start, end] = range;
    const container = this.#traverse(doc, currentPath);

    if (typeof container !== "string") {
      return undefined;
    }

    try {
      const propPath = this.#toAutomergePath(doc, currentPath);
      const startCursor = Automerge.getCursor(doc, propPath, start);
      const endCursor = Automerge.getCursor(doc, propPath, end);
      return [startCursor, endCursor];
    } catch (e) {
      return undefined;
    }
  }

  /** Convert PathSegment[] to Automerge.Prop[] by resolving IDs to indices. */
  #toAutomergePath(
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

      const prop = this.#toAutomergeProp(current, segment, allowRanges);
      propPath.push(prop);
      current = current[prop];
    }

    return propPath;
  }

  /** Convert a single PathSegment to an Automerge.Prop. */
  #toAutomergeProp(
    current: any,
    segment: PathSegment,
    allowRanges: boolean
  ): Automerge.Prop {
    const id = segment[ID];
    const query = segment[QUERY];

    if (id !== undefined) {
      if (typeof id === "string") {
        if (!Array.isArray(current)) {
          throw new Error("ObjectId segment requires array container");
        }
        const index = findIndexByObjectId(current, id);
        if (index === -1) {
          throw new Error(`ObjectId not found: ${id}`);
        }
        return index;
      }

      if (!allowRanges) {
        throw new Error("Cannot resolve through a range segment");
      }
      throw new Error("Range segments cannot be part of a property path");
    }

    if (query === undefined) {
      throw new Error("PathSegment has neither ID nor QUERY");
    }

    if (typeof query === "string" || typeof query === "number") {
      return query;
    }

    if (Array.isArray(query)) {
      if (!allowRanges) {
        throw new Error("Cannot resolve through a range segment");
      }
      throw new Error("Range segments cannot be part of a property path");
    }

    if (!Array.isArray(current)) {
      throw new Error("Where clause requires array container");
    }
    const index = findIndexByWhereClause(current, query);
    if (index === -1) {
      throw new Error(`No item matches where clause: ${JSON.stringify(query)}`);
    }
    return index;
  }

  /** Traverse a path to get a value. */
  #traverse(container: any, path: PathSegment[]): any {
    let current = container;

    for (const segment of path) {
      if (current === undefined || current === null) {
        return undefined;
      }

      current = this.#getValueAt(current, segment);
    }

    return current;
  }

  /** Get value at a single path segment. */
  #getValueAt(container: any, segment: PathSegment): any {
    const id = segment[ID];
    const query = segment[QUERY];

    if (id !== undefined) {
      return typeof id === "string"
        ? this.#findByObjectId(container, id)
        : this.#getRange(container, id);
    }

    if (query === undefined) return undefined;

    if (typeof query === "string" || typeof query === "number") {
      return container[query];
    }

    return Array.isArray(query)
      ? this.#getRange(container, query as [number, number])
      : this.#findByWhereClause(container, query);
  }

  /** Find an object in an array by its Automerge ObjectId. */
  #findByObjectId(container: any[], objectId: string): any {
    if (!Array.isArray(container)) return undefined;
    return container.find((item) => Automerge.getObjectId(item) === objectId);
  }

  /** Find an object in an array matching a where clause. */
  #findByWhereClause(container: any[], clause: Record<string, any>): any {
    if (!Array.isArray(container)) return undefined;
    return container.find((item) => matchesWhereClause(item, clause));
  }

  /** Get a substring or subarray using a range. */
  #getRange(
    text: string,
    range: [Automerge.Cursor, Automerge.Cursor] | [number, number]
  ): string {
    if (isNumericRange(range)) {
      return text.slice(range[0], range[1]);
    }

    if (isCursorRange(range)) {
      try {
        const doc = this.doc();
        const textPath = this.path.slice(0, -1);
        const propPath = this.#toAutomergePath(doc, textPath);

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

  /** Set a value at a path. */
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

    const query = lastSegment[QUERY];
    if (typeof query === "string" || typeof query === "number") {
      parent[query] = value;
    } else {
      throw new Error(
        "Cannot set value: last segment must be a property name or index"
      );
    }
  }

  /** Check if any patch affects this ref's target. */
  #patchAffectsRef(patches: Automerge.Patch[]): boolean {
    const doc = this.doc();
    if (!doc) return false;

    try {
      const nonRangeSegments = this.path.filter((seg) => {
        const id = seg[ID];
        const query = seg[QUERY];
        return !(Array.isArray(id) || Array.isArray(query));
      });

      const refPropPath = this.#toAutomergePath(doc, nonRangeSegments);

      for (const patch of patches) {
        if (this.#pathsOverlap(patch.path, refPropPath)) {
          return true;
        }
      }

      return false;
    } catch (e) {
      return patches.length > 0;
    }
  }

  /** Check if a patch path overlaps with the ref's path. */
  #pathsOverlap(
    patchPath: Automerge.Prop[],
    refPropPath: Automerge.Prop[]
  ): boolean {
    const minLength = Math.min(patchPath.length, refPropPath.length);

    for (let i = 0; i < minLength; i++) {
      if (patchPath[i] !== refPropPath[i]) {
        return false;
      }
    }

    return true;
  }

  /** Serialize a path segment to a URI component. */
  #serialize(segment: PathSegment): string {
    const id = segment[ID];
    const query = segment[QUERY];

    if (id !== undefined) {
      if (typeof id === "string") {
        return `$${id}`;
      }
      const [start, end] = id;
      return `[$${start},$${end}]`;
    }

    if (query === undefined) {
      throw new Error("PathSegment has neither ID nor QUERY to serialize");
    }

    if (typeof query === "string" || typeof query === "number") {
      return String(query);
    }

    if (isNumericRange(query)) {
      return `[${query[0]},${query[1]}]`;
    }

    return JSON.stringify(query);
  }
}

/**
 * Create a ref to a location in an Automerge document.
 *
 * Refs are stable by default - they track by ID, not position.
 *
 * @example
 * ```ts
 * // Stable refs (survive document changes)
 * ref(handle, 'todos', 0, 'title')
 * ref(handle, 'todos', { id: 'abc' }, 'done')
 *
 * // Dynamic refs (track by position)
 * ref(handle, 'todos', at(0), 'title')
 * ```
 */
export function ref<T = any>(
  docHandle: DocHandle<any>,
  ...segments: PathInput[]
): Ref<T> {
  return new Ref<T>(docHandle, segments);
}
