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
  readonly path: Segment[];
  readonly options: RefOptions;

  #ctx?: RefContext;

  constructor(
    docHandle: DocHandle<TDoc>,
    segments: readonly [...TPath],
    options: RefOptions = {}
  ) {
    this.docHandle = docHandle;
    this.options = options;

    const doc = docHandle.doc();
    this.path = this.#normalizePath(doc, segments as unknown as PathInput[]);
  }

  set heads(heads: string[] | undefined) {
    this.options.heads = heads;
  }

  get heads(): string[] | undefined {
    return this.options.heads;
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

  static #parsePath(path: string): Segment[] {
    if (!path || path === "/") return [];

    return path.split("/").map((segment): Segment => {
      if (!segment) {
        throw new Error("Invalid path: empty segment");
      }
      return this.#parse(segment);
    });
  }

  static #parse(segment: string): Segment {
    if (segment.startsWith("$")) {
      return { [KIND]: "stable_index", id: segment.slice(1) };
    }

    if (segment.startsWith("[")) {
      return this.#parseRange(segment);
    }

    if (segment.startsWith("{")) {
      return this.#parseJson(segment);
    }

    if (/^\d+$/.test(segment)) {
      return { [KIND]: "index", index: parseInt(segment, 10) };
    }

    return { [KIND]: "key", key: segment };
  }

  static #parseRange(segment: string): Segment {
    const content = segment.slice(1, -1);
    const parts = content.split(",");

    if (parts.length !== 2) {
      throw new Error(`Invalid range: ${segment}`);
    }

    const [first, second] = parts;

    if (first.startsWith("$") && second.startsWith("$")) {
      return {
        [KIND]: "stable_range",
        start: first.slice(1) as Automerge.Cursor,
        end: second.slice(1) as Automerge.Cursor,
      };
    }

    const start = parseInt(first, 10);
    const end = parseInt(second, 10);

    if (isNaN(start) || isNaN(end)) {
      throw new Error(`Invalid numeric range: ${segment}`);
    }

    return { [KIND]: "range", start, end };
  }

  static #parseJson(segment: string): Segment {
    try {
      const parsed = JSON.parse(segment);
      return { [KIND]: "query", clause: parsed };
    } catch (e) {
      throw new Error(`Invalid JSON segment: ${segment}`);
    }
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
  #normalizePath(doc: Doc<TDoc>, inputs: PathInput[]): Segment[] {
    let currentPath: Segment[] = [];

    return inputs.map((input) => {
      const segment = isSegment(input)
        ? input
        : this.#normalizeInput(
            doc,
            currentPath,
            input as Exclude<PathInput, Segment>
          );

      currentPath.push(segment);
      return segment;
    });
  }

  #normalizeInput(
    doc: Doc<TDoc>,
    currentPath: Segment[],
    input: Exclude<PathInput, Segment>
  ): Segment {
    if (typeof input === "string") {
      return { [KIND]: "key", key: input };
    }

    if (typeof input === "number") {
      // Try to stabilize: find the ObjectId for this array item
      const container = this.#traverse(doc, currentPath);
      if (Array.isArray(container)) {
        const item = container[input];
        const id = item ? Automerge.getObjectId(item) : undefined;
        if (id) {
          return { [KIND]: "stable_index", id };
        }
      }
      return { [KIND]: "index", index: input };
    }

    if (Array.isArray(input) && input.length === 2) {
      // Try to stabilize: convert numeric range to cursor range
      const container = this.#traverse(doc, currentPath);
      if (typeof container === "string") {
        try {
          const propPath = this.#toAutomergePath(doc, currentPath);
          const start = Automerge.getCursor(doc, propPath, input[0]);
          const end = Automerge.getCursor(doc, propPath, input[1]);
          return { [KIND]: "stable_range", start, end };
        } catch {
          // Fall through to unstable range
        }
      }
      return { [KIND]: "range", start: input[0], end: input[1] };
    }

    if (isPlainObject(input)) {
      // Try to stabilize: find the ObjectId for item matching where clause
      const container = this.#traverse(doc, currentPath);
      if (Array.isArray(container)) {
        const item = container.find((obj) => matchesWhereClause(obj, input));
        const id = item ? Automerge.getObjectId(item) : undefined;
        if (id) {
          return { [KIND]: "stable_index", id };
        }
      }
      return { [KIND]: "query", clause: input };
    }

    throw new Error(
      `Unsupported path input type: ${typeof input}. ` +
        `Expected string, number, plain object, or array.`
    );
  }

  #toAutomergePath(doc: Doc<TDoc>, path: Segment[]): Prop[] {
    const propPath: Prop[] = [];
    let current: any = doc;

    for (const segment of path) {
      if (current === undefined || current === null) {
        throw new Error(
          "Cannot resolve path: traversal reached null/undefined"
        );
      }

      const prop = this.#toAutomergeProp(current, segment);
      propPath.push(prop);
      current = current[prop];
    }

    return propPath;
  }

  #toAutomergeProp(current: any, segment: Segment): Prop {
    switch (segment[KIND]) {
      case "key":
        return segment.key;

      case "index":
        return segment.index;

      case "stable_index":
        if (!Array.isArray(current)) {
          throw new Error(
            `ObjectId segment requires array container. ` +
              `ObjectId: ${segment.id}, Container type: ${typeof current}`
          );
        }
        const index = findIndexByObjectId(current, segment.id);
        if (index === -1) {
          throw new Error(
            `ObjectId not found: ${segment.id}. ` +
              `This object may have been deleted.`
          );
        }
        return index;

      case "query":
        if (!Array.isArray(current)) {
          throw new Error(
            `Where clause requires array container. ` +
              `Where clause: ${JSON.stringify(segment.clause)}, Container type: ${typeof current}`
          );
        }
        const queryIndex = findIndexByWhereClause(current, segment.clause);
        if (queryIndex === -1) {
          throw new Error(
            `No item matches where clause: ${JSON.stringify(segment.clause)}. ` +
              `Array length: ${current.length}`
          );
        }
        return queryIndex;

      case "range":
      case "stable_range":
        throw new Error("Range segments cannot be part of a property path");

      default:
        segment satisfies never;
        throw new Error(`Unknown segment kind: ${segment[KIND]}`);
    }
  }

  #traverse(container: any, path: Segment[]): any {
    let current = container;

    for (const segment of path) {
      if (current === undefined || current === null) {
        return undefined;
      }

      current = this.#getValueAt(current, segment);
    }

    return current;
  }

  #getValueAt(container: any, segment: Segment): any {
    switch (segment[KIND]) {
      case "key":
        return container[segment.key];

      case "index":
        return container[segment.index];

      case "stable_index":
        if (!Array.isArray(container)) return undefined;
        return container.find(
          (item) => Automerge.getObjectId(item) === segment.id
        );

      case "query":
        if (!Array.isArray(container)) return undefined;
        return container.find((item) =>
          matchesWhereClause(item, segment.clause)
        );

      case "range":
      case "stable_range":
        return this.#getRange(container, [segment.start, segment.end] as
          | [Cursor, Cursor]
          | [number, number]);

      default:
        segment satisfies never;
        throw new Error(`Unknown segment kind: ${segment[KIND]}`);
    }
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
    try {
      const propPath = this.#toAutomergePath(doc, path);
      const start = Automerge.getCursorPosition(doc, propPath, startCursor);
      const end = Automerge.getCursorPosition(doc, propPath, endCursor);

      if (start === undefined || end === undefined) return undefined;
      return [start, end];
    } catch {
      return undefined;
    }
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
        parent[lastSegment.key] = value;
        break;
      case "index":
        parent[lastSegment.index] = value;
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
        const propPath = this.#toAutomergePath(doc, parentPath);
        const deleteCount = end - start;
        Automerge.splice(doc, propPath, start, deleteCount, value);
        break;
      }
      default:
        throw new Error(
          "Cannot set value: last segment must be a key, index, or range"
        );
    }
  }

  #patchAffectsRef(patches: Automerge.Patch[]): boolean {
    const doc = this.docHandle.doc();

    const nonRangeSegments = this.path.filter((seg) => {
      return seg[KIND] !== "range" && seg[KIND] !== "stable_range";
    });

    // Resolve as much of the path as possible
    // This fires onChange when ref becomes invalid (parent changed) but not while it stays invalid
    const refPropPath = this.#resolvePathBestEffort(doc, nonRangeSegments);

    // If we couldn't resolve any part, ref was never valid - don't fire
    if (refPropPath.length === 0) return false;

    return patches.some((patch) => this.#pathsOverlap(patch.path, refPropPath));
  }

  /**
   * Resolve as much of the path as possible, stopping at the first unresolvable segment.
   * Used for onChange to detect when a ref becomes invalid (fires once) vs stays invalid (silent).
   */
  #resolvePathBestEffort(doc: any, segments: Segment[]): Prop[] {
    const propPath: Prop[] = [];
    let current: any = doc;

    for (const segment of segments) {
      if (current === undefined || current === null) break;

      try {
        const prop = this.#toAutomergeProp(current, segment);
        propPath.push(prop);
        current = current[prop];
      } catch {
        // Can't resolve this segment (e.g., ObjectId not found) - stop here
        break;
      }
    }

    return propPath;
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

  #serialize(segment: Segment): string {
    switch (segment[KIND]) {
      case "key":
        return segment.key;

      case "index":
        return String(segment.index);

      case "stable_index":
        return `$${segment.id}`;

      case "query":
        return JSON.stringify(segment.clause);

      case "range":
        return `[${segment.start},${segment.end}]`;

      case "stable_range":
        return `[$${segment.start},$${segment.end}]`;

      default:
        segment satisfies never;
        throw new Error(`Unknown segment kind: ${segment[KIND]}`);
    }
  }
}
