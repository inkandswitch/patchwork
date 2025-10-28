import { deepEqual } from "../utils/deepEqual";
import { AnnotationType } from "./annotations";
import { ANNOTATIONS_SYMBOL, FIELDS_SYMBOL, Ref } from "./refs";

export class Context {
  #subscribers = new Set<() => void>();
  #refsById: Map<string, Ref> = new Map();
  #subcontexts = new Set<Context>();

  constructor(public readonly name?: string) {}

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

    const annotations = new Map<string, any>();
    clone[ANNOTATIONS_SYMBOL] = annotations;

    this.#resolveRef(clone);

    return clone;
  }

  #resolveRef(ref: Ref) {
    const storedRef = this.#refsById.get(ref.toId());

    if (storedRef) {
      for (const [key, value] of storedRef[ANNOTATIONS_SYMBOL].entries()) {
        ref[ANNOTATIONS_SYMBOL].set(key, value);
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

  get subcontexts(): Context[] {
    return Array.from(this.#subcontexts);
  }

  #resolveAll(refsById: Map<string, Ref>) {
    for (const ref of this.#refsById.values()) {
      const id = ref.toId();
      let resolvedRef = refsById.get(id);
      if (!resolvedRef) {
        resolvedRef = ref.clone();
        refsById.set(id, resolvedRef);
      }

      for (const [key, value] of ref[ANNOTATIONS_SYMBOL].entries()) {
        resolvedRef[ANNOTATIONS_SYMBOL].set(key, value);
      }
    }

    for (const context of this.#subcontexts) {
      context.#resolveAll(refsById);
    }
  }

  refsWith<V = unknown>(annotation: AnnotationType<V>): Ref[] {
    return this.refs.filter((ref) => ref.has(annotation));
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

  subcontext(name?: string): Context {
    const subcontext = new Context(name);
    subcontext.subscribe(this.#notify);
    this.#subcontexts.add(subcontext);
    return subcontext;
  }

  remove(context: Context) {
    context.unsubscribe(this.#notify);
    this.#subcontexts.delete(context);
    this.#notify();
  }

  // ==== debug methods ====

  dump() {
    return this.refs.flatMap((ref) =>
      ref.annotations.map(([key, value]) => [ref.toId(), key, value])
    );
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

  for (const [key, value] of ref[ANNOTATIONS_SYMBOL].entries()) {
    storedRef[ANNOTATIONS_SYMBOL].set(key, value);
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

    const annotationsA = refA[ANNOTATIONS_SYMBOL];
    const annotationsB = refB[ANNOTATIONS_SYMBOL];

    if (annotationsA.size !== annotationsB.size) {
      return false;
    }

    for (const [annotationTypeA, annotationValueA] of annotationsA.entries()) {
      const annotationValueB = annotationsB.get(annotationTypeA);

      if (!annotationValueB) {
        return false;
      }

      if (!deepEqual(annotationValueA, annotationValueB)) {
        return false;
      }
    }
  }

  return true;
};
