import * as Automerge from "@automerge/automerge";
import { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { lookup } from "../utils/lookup";
import { FieldType, FieldValue } from "./fields";

export const $fields = Symbol("fields");

export type RefWith<Fields extends symbol> = Ref<unknown, unknown, Fields>;

export type SerializedPathRef = {
  type: "path";
  path: Automerge.Prop[];
};

export type SerializedIdRef = {
  type: "id";
  path: Automerge.Prop[];
  key: Automerge.Prop;
  id: string;
};

export type SerializedTextSpanRef = {
  type: "text-span";
  path: Automerge.Prop[];
  from: Automerge.Cursor;
  to: Automerge.Cursor;
};

export type SerializedRef =
  | SerializedPathRef
  | SerializedIdRef
  | SerializedTextSpanRef;

export abstract class Ref<
  Value = unknown,
  Doc = unknown,
  Fields extends symbol = never
> {
  [$fields] = new Map<symbol, any>();

  readonly docHandle: DocHandle<Doc>;
  readonly path: Automerge.Prop[];

  constructor(docHandle: DocHandle<Doc>, path: Automerge.Prop[]) {
    this.docHandle = docHandle;
    this.path = path;
  }

  // ==== methods to implement in subclasses ====

  abstract toId(): string;

  protected abstract resolve(doc: Doc): Value;

  abstract clone(): Ref<Value, Doc, Fields>;

  abstract serialize(): SerializedRef;

  // ==== value methods ====

  get value(): Value {
    return this.resolve(this.docHandle.doc());
  }

  valueAt(heads: Automerge.Heads) {
    return this.resolve(Automerge.view(this.docHandle.doc(), heads));
  }

  // todo: this is not right
  // the method should only be available if the value is a string
  slice(from: number, to: number) {
    return new TextSpanRef(this.docHandle, this.path, from, to);
  }

  get docRef(): Ref<Doc, Doc, Fields> {
    return new PathRef(this.docHandle, []); // maybe we should have a doc ref as a separate class?
  }

  get docUrl(): AutomergeUrl {
    return this.docHandle.url;
  }

  // ==== mutation methods ====

  change(fn: (obj: Value) => void) {
    this.docHandle.change((doc) => {
      const obj = this.resolve(doc);

      if (obj) {
        fn(obj);
      }
    });
  }

  // ==== ref arithmetic methods ====

  isEqual(other: Ref) {
    return this.toId() === other.toId();
  }

  doesOverlap(other: Ref) {
    return this.toId() === other.toId();
  }

  // is other a ref to an item in the collection the current ref points to
  isElementOf(other: Ref) {
    if (
      other.docHandle !== this.docHandle ||
      other.path.length + 1 !== this.path.length
    ) {
      return false;
    }

    for (let i = 0; i < other.path.length; i++) {
      if (this.path[i] !== other.path[i]) {
        return false;
      }
    }

    return true;
  }

  // ==== field methods ====

  with<Type extends symbol, Value>(
    field: FieldValue<Type, Value>
  ): Ref<Value, Doc, Fields | Type> {
    const clone = this.clone();
    clone[$fields] = new Map(this[$fields]);
    clone[$fields].set(field.type, field.value);

    return clone as unknown as Ref<Value, Doc, Fields | Type>;
  }

  get<Type extends symbol, Value>(field: FieldType<Type, Value>) {
    return this[$fields].get(field.type) as Type extends Fields
      ? Value
      : Value | undefined;
  }

  has<Type extends symbol, Value>(field: FieldType<Type, Value>) {
    return this[$fields].has(field.type) as Type extends Fields
      ? true
      : boolean;
  }

  get fields(): [symbol, any][] {
    return Array.from(this[$fields].entries());
  }
}

export class PathRef<
  Value = unknown,
  Doc = unknown,
  Fields extends symbol = never
> extends Ref<Value, Doc, Fields> {
  constructor(docHandle: DocHandle<Doc>, path: Automerge.Prop[]) {
    super(docHandle, path);
  }

  protected resolve(doc: Automerge.Doc<Doc>): Value {
    return lookup(doc, this.path) as Value;
  }

  toId(): string {
    const url = this.docHandle.url;
    const path = JSON.stringify(this.path);
    return `${url}:${path}`;
  }

  clone(): Ref<Value, Doc, Fields> {
    return new PathRef(this.docHandle, this.path);
  }

  serialize(): SerializedRef {
    return { type: "path", path: this.path };
  }
}

export class IdRef<
  Value = unknown,
  Doc = unknown,
  Fields extends symbol = never
> extends Ref<Value, Doc, Fields> {
  #id: any;
  #key: Automerge.Prop;

  constructor(
    docHandle: DocHandle<Doc>,
    path: Automerge.Prop[],
    id: any,
    key: Automerge.Prop
  ) {
    super(docHandle, path);
    this.#id = id;
    this.#key = key;
  }

  protected resolve(doc: Automerge.Doc<Doc>): Value {
    const objects = lookup(doc, this.path);
    return objects.find((obj: any) => obj[this.#key] === this.#id) as Value;
  }

  toId(): string {
    return this.#id;
  }

  clone(): Ref<Value, Doc, Fields> {
    return new IdRef(this.docHandle, this.path, this.#id, this.#key);
  }

  serialize(): SerializedRef {
    return {
      type: "id",
      path: this.path,
      id: this.#id,
      key: this.#key,
    };
  }
}

export class TextSpanRef<
  Value = string,
  Doc = unknown,
  Fields extends symbol = never
> extends Ref<Value, Doc, Fields> {
  #fromCursor: Automerge.Cursor;
  #toCursor: Automerge.Cursor;

  constructor(
    docHandle: DocHandle<Doc>,
    path: Automerge.Prop[],
    from: number | Automerge.Cursor,
    to: number | Automerge.Cursor
  ) {
    super(docHandle, path);

    const doc = docHandle.doc();
    this.#fromCursor =
      typeof from === "number" ? Automerge.getCursor(doc, path, from) : from;
    this.#toCursor =
      typeof to === "number" ? Automerge.getCursor(doc, path, to) : to;
  }

  get from() {
    return Automerge.getCursorPosition(
      this.docHandle.doc(),
      this.path,
      this.#fromCursor
    );
  }

  get to() {
    return Automerge.getCursorPosition(
      this.docHandle.doc(),
      this.path,
      this.#toCursor
    );
  }

  protected resolve(doc: Automerge.Doc<Doc>): Value {
    const from = Automerge.getCursorPosition(doc, this.path, this.#fromCursor);
    const to = Automerge.getCursorPosition(doc, this.path, this.#toCursor);

    return lookup<string>(doc, this.path)!.slice(from, to) as Value;
  }

  toId(): string {
    return `${this.#fromCursor}:${this.#toCursor}`;
  }

  isElementOf(other: Ref): boolean {
    return this.doesOverlap(other);
  }

  doesOverlap(other: Ref): boolean {
    if (
      !(other instanceof TextSpanRef) ||
      this.docHandle !== other.docHandle ||
      this.path.length !== other.path.length
    ) {
      return false;
    }
    for (let i = 0; i < this.path.length; i++) {
      if (this.path[i] !== other.path[i]) return false;
    }

    const aStart = Math.min(this.from, this.to);
    const aEnd = Math.max(this.from, this.to);
    const bStart = Math.min(other.from, other.to);
    const bEnd = Math.max(other.from, other.to);

    return aEnd > bStart && bEnd > aStart;
  }

  slice(from: number, to: number) {
    return new TextSpanRef(
      this.docHandle,
      this.path,
      this.from + from,
      this.from + to
    );
  }

  // todo: figure out what to do here
  // we could implement a mutable string here but that feels bad
  change(fn: (obj: Value) => void): void {
    throw new Error("not implemented");
  }

  clone(): Ref<Value, Doc, Fields> {
    return new TextSpanRef(this.docHandle, this.path, this.from, this.to);
  }

  serialize(): SerializedRef {
    return {
      type: "text-span",
      path: this.path,
      from: this.#fromCursor,
      to: this.#toCursor,
    };
  }
}

export type TextSpanRefWith<Fields extends symbol> = TextSpanRef<
  unknown,
  unknown,
  Fields
>;

export const loadRef = (
  docHandle: DocHandle<unknown>,
  ref: SerializedRef
): Ref => {
  switch (ref.type) {
    case "path":
      return new PathRef(docHandle, ref.path);
    case "id":
      return new IdRef(docHandle, ref.path, ref.id, ref.key);
    case "text-span":
      return new TextSpanRef(docHandle, ref.path, ref.from, ref.to);
  }
};
