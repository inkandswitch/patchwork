import * as Automerge from "@automerge/automerge";
import type { Doc, Cursor, Prop } from "@automerge/automerge";
import type {
  DocHandle,
  DocHandleChangePayload,
} from "@automerge/automerge-repo";
import type {
  PathSegment,
  PathInput,
  RefOptions,
  RefContext,
  InferRefType,
  ChangeFn,
} from "./types";
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
  readonly options: RefOptions;

  #ctx?: RefContext;
  #heads?: string[];

  constructor(
    docHandle: DocHandle<TDoc>,
    segments: readonly [...TPath],
    options: RefOptions = {}
  ) {
    this.docHandle = docHandle;
    this.#heads = options.heads;
    this.options = options;

    const doc = docHandle.doc();
    this.path = this.#normalizePath(doc, segments as unknown as PathInput[]);
  }

  set heads(heads: string[] | undefined) {
    this.#heads = heads;
    this.options.heads = heads;
  }

  get heads(): string[] | undefined {
    return this.#heads;
  }

  /** Parse a ref from a URL string */
  static fromUrl<TDoc = any>(
    handle: DocHandle<TDoc>,
    path: string,
    heads?: string
  ): Ref<TDoc, PathInput[]> {
    const segments = path ? Ref.#parsePath(path) : [];

    const options: RefOptions = {};
    if (heads) {
      options.heads = heads.split(",");
    }

    return new Ref<TDoc, PathInput[]>(handle, segments, options);
  }

  static #parsePath(path: string): PathSegment[] {
    if (!path || path === "/") return [];

    return path.split("/").map((segment): PathSegment => {
      if (!segment) {
        throw new Error("Invalid path: empty segment");
      }
      return this.#parse(segment);
    });
  }

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

  static #parseJson(segment: string): PathSegment {
    try {
      const parsed = JSON.parse(segment);
      return { [QUERY]: parsed };
    } catch (e) {
      throw new Error(`Invalid JSON segment: ${segment}`);
    }
  }

  /** Get the current value, or undefined if path can't be resolved */
  value(): InferRefType<TDoc, TPath> | undefined {
    const doc = this.doc();
    if (!doc) return undefined;
    return this.#traverse(doc, this.path);
  }

  doc(): Doc<TDoc> {
    const doc = this.docHandle.doc();
    if (!doc) throw new Error("Document not loaded");
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

  get url(): string {
    const docId = this.docHandle.documentId;
    const pathStr = this.path.map((seg) => this.#serialize(seg)).join("/");
    const headsStr = this.options.heads
      ? `#${this.options.heads.join(",")}`
      : "";
    return `automerge:${docId}/${pathStr}${headsStr}`;
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

  #getContext(): RefContext {
    if (!this.#ctx) {
      this.#ctx = {
        splice: (index: number, deleteCount: number, insert?: string) => {
          this.docHandle.change((doc: Doc<TDoc>) => {
            const propPath = this.#toAutomergePath(doc, this.path);
            Automerge.splice(doc, propPath, index, deleteCount, insert);
          });
        },
        updateText: (newValue: string) => {
          this.docHandle.change((doc: Doc<TDoc>) => {
            const propPath = this.#toAutomergePath(doc, this.path);
            Automerge.updateText(doc, propPath, newValue);
          });
        },
      };
    }
    return this.#ctx;
  }

  /** Normalize path inputs and extract stable IDs where possible */
  #normalizePath(doc: Doc<TDoc>, inputs: PathInput[]): PathSegment[] {
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

  #getStableId(
    doc: Doc<TDoc>,
    currentPath: PathSegment[],
    input: Exclude<PathInput, PathSegment>
  ): string | [Cursor, Cursor] | undefined {
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

  #getObjectIdAt(
    doc: Doc<TDoc>,
    currentPath: PathSegment[],
    index: number
  ): string | undefined {
    return this.#getObjectIdForItem(doc, currentPath, (arr) => arr[index]);
  }

  #getObjectIdForWhereClause(
    doc: Doc<TDoc>,
    currentPath: PathSegment[],
    clause: Record<string, any>
  ): string | undefined {
    return this.#getObjectIdForItem(doc, currentPath, (arr) =>
      arr.find((obj) => matchesWhereClause(obj, clause))
    );
  }

  #getObjectIdForItem(
    doc: Doc<TDoc>,
    currentPath: PathSegment[],
    findItem: (arr: any[]) => any
  ): string | undefined {
    const container = this.#traverse(doc, currentPath);
    if (!Array.isArray(container)) return undefined;

    const item = findItem(container);
    if (!item) return undefined;

    return Automerge.getObjectId(item) || undefined;
  }

  #getCursorsForRange(
    doc: Doc<TDoc>,
    currentPath: PathSegment[],
    range: [number, number]
  ): [Cursor, Cursor] | undefined {
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

  #toAutomergePath(
    doc: Doc<TDoc>,
    path: PathSegment[],
    allowRanges = false
  ): Prop[] {
    const propPath: Prop[] = [];
    let current: any = doc;

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

  #toAutomergeProp(
    current: any,
    segment: PathSegment,
    allowRanges: boolean
  ): Prop {
    const id = segment[ID];
    const query = segment[QUERY];

    if (id !== undefined) {
      if (typeof id === "string") {
        if (!Array.isArray(current)) {
          throw new Error(
            `ObjectId segment requires array container.\n` +
              `ObjectId: ${id}\n` +
              `Container type: ${typeof current}\n` +
              `Ref URL: ${this.url}`
          );
        }
        const index = findIndexByObjectId(current, id);
        if (index === -1) {
          throw new Error(
            `ObjectId not found: ${id}\n` +
              `This object may have been deleted.\n` +
              `Ref URL: ${this.url}`
          );
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
      throw new Error(
        `Where clause requires array container.\n` +
          `Where clause: ${JSON.stringify(query)}\n` +
          `Container type: ${typeof current}\n` +
          `Ref URL: ${this.url}`
      );
    }
    const index = findIndexByWhereClause(current, query);
    if (index === -1) {
      throw new Error(
        `No item matches where clause: ${JSON.stringify(query)}\n` +
          `Array length: ${current.length}\n` +
          `Ref URL: ${this.url}`
      );
    }
    return index;
  }

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

  #findByObjectId(container: any[], objectId: string): any {
    if (!Array.isArray(container)) return undefined;
    return container.find((item) => Automerge.getObjectId(item) === objectId);
  }

  #findByWhereClause(container: any[], clause: Record<string, any>): any {
    if (!Array.isArray(container)) return undefined;
    return container.find((item) => matchesWhereClause(item, clause));
  }

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

  #patchAffectsRef(patches: Automerge.Patch[]): boolean {
    const doc = this.doc();
    if (!doc) return false;

    const nonRangeSegments = this.path.filter((seg) => {
      const id = seg[ID];
      const query = seg[QUERY];
      return !(Array.isArray(id) || Array.isArray(query));
    });

    // Try to resolve path; if it fails partway, check patches against partial path
    let refPropPath: Prop[] = [];
    try {
      refPropPath = this.#toAutomergePath(doc, nonRangeSegments);
    } catch (e) {
      // Resolution failed - try segment by segment to get partial path
      let current: any = doc;
      for (const segment of nonRangeSegments) {
        if (current === undefined || current === null) break;
        try {
          const prop = this.#toAutomergeProp(current, segment, false);
          refPropPath.push(prop);
          current = current[prop];
        } catch {
          break; // Can't resolve further (e.g., ObjectId not found)
        }
      }

      if (refPropPath.length === 0) return false;
    }

    for (const patch of patches) {
      if (this.#pathsOverlap(patch.path, refPropPath)) {
        return true;
      }
    }

    return false;
  }

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
 * Create a ref with automatic type inference.
 *
 * @example
 * ```ts
 * const titleRef = ref(handle, 'todos', 0, 'title');
 * titleRef.value(); // string | undefined
 * ```
 */
export function ref<TDoc, TPath extends readonly PathInput[]>(
  docHandle: DocHandle<TDoc>,
  ...segments: [...TPath]
): Ref<TDoc, TPath> {
  return new Ref<TDoc, TPath>(docHandle, segments as [...TPath]);
}
