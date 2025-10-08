import { deepEqual } from "../utils/deepEqual";
import { FieldType } from "./fields";
import { Ref, RefWith } from "./refs";
import { $fields } from "./refs";

export class Context {
  #subscribers = new Set<() => void>();
  #refsById: Map<string, Ref> = new Map();
  #subcontexts = new Set<Context>();

  constructor() {}

  // ==== mutation methods ====

  add(ref: Ref | Ref[]) {
    addTo(this.#refsById, ref);
    this.#notify();
  }

  replace(ref: Ref | Ref[]) {
    const newRefsById = new Map<string, Ref>();
    addTo(newRefsById, ref);

    if (isEqual(this.#refsById, newRefsById)) {
      return;
    }

    this.#refsById = newRefsById;
    this.#notify();
  }

  // ==== query methods ====

  resolve(ref: Ref): Ref {
    const clone = ref.clone();

    const fields = new Map<symbol, any>();
    clone[$fields] = fields;

    this.#resolveRef(clone);

    return clone;
  }

  #resolveRef(ref: Ref) {
    const storedRef = this.#refsById.get(ref.toId());

    if (storedRef) {
      for (const [key, value] of storedRef[$fields].entries()) {
        ref[$fields].set(key, value);
      }
    }

    for (const context of this.#subcontexts) {
      context.#resolveRef(ref);
    }
  }

  get refs(): Ref[] {
    const refsById = new Map<string, Ref>();

    this.#resolveAll(refsById);

    return Array.from(refsById.values());
  }

  #resolveAll(refsById: Map<string, Ref>) {
    for (const ref of this.#refsById.values()) {
      const id = ref.toId();
      let resolvedRef = refsById.get(id);
      if (!resolvedRef) {
        resolvedRef = ref.clone();
        refsById.set(id, resolvedRef);
      }

      for (const [key, value] of ref[$fields].entries()) {
        resolvedRef[$fields].set(key, value);
      }
    }

    for (const context of this.#subcontexts) {
      context.#resolveAll(refsById);
    }
  }

  refsWith<Type extends symbol>(field: FieldType<Type, any>) {
    return this.refs.filter((ref) =>
      ref.has(field)
    ) as unknown as RefWith<Type>[];
  }

  // ==== subscription methods ====

  #notify = () => {
    this.#subscribers.forEach((subscriber) => subscriber());
  };

  subscribe(fn: () => void) {
    this.#subscribers.add(fn);
  }

  unsubscribe(fn: () => void) {
    this.#subscribers.delete(fn);
  }

  // ==== subcontext methods ====

  subcontext(): Context {
    const subcontext = new Context();
    subcontext.subscribe(this.#notify);
    this.#subcontexts.add(subcontext);
    return subcontext;
  }

  remove(context: Context) {
    context.unsubscribe(this.#notify);
    this.#subcontexts.delete(context);
  }
}

const addTo = (refsById: Map<string, Ref>, ref: Ref | Ref[]) => {
  if (Array.isArray(ref)) {
    for (const item of ref) {
      addTo(refsById, item);
    }
    return;
  }

  let storedRef = refsById.get(ref.toId());
  if (!storedRef) {
    storedRef = ref.clone();
    refsById.set(ref.toId(), storedRef);
  }

  for (const [key, value] of ref[$fields].entries()) {
    storedRef[$fields].set(key, value);
  }
};

const isEqual = (a: Map<string, Ref>, b: Map<string, Ref>) => {
  if (a.size !== b.size) {
    return false;
  }

  for (const refA of a.values()) {
    const refB = b.get(refA.toId());

    if (!refB) {
      return false;
    }

    const fieldsA = refA[$fields];
    const fieldsB = refB[$fields];

    if (fieldsA.size !== fieldsB.size) {
      return false;
    }

    for (const [fieldTypeA, fieldValueA] of fieldsA.entries()) {
      const fieldValueB = fieldsB.get(fieldTypeA);

      if (!fieldValueB) {
        return false;
      }

      if (!deepEqual(fieldValueA, fieldValueB)) {
        return false;
      }
    }
  }

  return true;
};
