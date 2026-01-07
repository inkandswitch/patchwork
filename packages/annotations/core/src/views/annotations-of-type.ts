import { SignalObject, SubscriberSet } from "@inkandswitch/signals";
import { type Ref } from "@patchwork/refs";
import EventEmitter from "eventemitter3";
import { AnnotationType, AnnotationValue } from "../annotation-type";
import {
  Annotation,
  AnnotationChange,
  AnnotationEvents,
  AnnotationSource,
} from "../types";
import { filterAnnotationChange, isChangeEmpty } from "../utils";

/**
 * FinalizationRegistry for automatic cleanup of AnnotationsOfType instances.
 * Ensures subscriptions are cleaned up when views are garbage collected.
 */
const viewCleanupRegistry = new FinalizationRegistry<() => void>((cleanup) =>
  cleanup()
);

/**
 * Annotations filtered by type
 * Allows lookup by ref
 */
export class AnnotationsOfType<T>
  extends EventEmitter<AnnotationEvents>
  implements
    AnnotationSource<unknown, T>,
    SignalObject<AnnotationsOfType<T>>
{
  #source: AnnotationSource;
  #type: AnnotationType<T>;
  #subscriberSet = new SubscriberSet<AnnotationsOfType<T>>();

  constructor(source: AnnotationSource, type: AnnotationType<T>) {
    super();
    this.#source = source;
    this.#type = type;
    const unsubscribe = this.#setupSubscription();
    viewCleanupRegistry.register(this, unsubscribe);
  }

  subscribe(callback: (value: AnnotationsOfType<T>) => void): () => void {
    return this.#subscriberSet.add(callback);
  }

  #setupSubscription(): () => void {
    const handleChange = (change: AnnotationChange) => {
      const filteredChange = filterAnnotationChange(
        change,
        (_, annotation) => annotation.type.id === this.#type.id
      );

      if (!isChangeEmpty(filteredChange)) {
        this.emit("change", filteredChange);
        this.#subscriberSet.notify(this);
      }
    };

    this.#source.on("change", handleChange);
    return () => this.#source.off("change", handleChange);
  }

  /**
   * Lookup the first annotation value for a ref
   */
  lookup(ref: Ref<unknown>): T | undefined {
    for (const [entryRef, annotation] of this.#source.entriesOfType(
      this.#type
    )) {
      if (entryRef === ref) {
        return annotation.value;
      }
    }
    return undefined;
  }

  /**
   * Lookup all annotation values for a ref
   */
  lookupAll(ref: Ref<unknown>): T[] {
    const result: T[] = [];
    for (const [entryRef, annotation] of this.#source.entriesOfType(
      this.#type
    )) {
      if (entryRef === ref) {
        result.push(annotation.value);
      }
    }
    return result;
  }

  /**
   * Iterator for all unique refs that have annotations of this type
   */
  get refs(): Iterable<Ref<unknown>> {
    const source = this.#source;
    const type = this.#type;
    return {
      *[Symbol.iterator]() {
        const seenRefs = new Set<Ref<unknown>>();

        for (const [ref] of source.entriesOfType(type)) {
          if (!seenRefs.has(ref)) {
            seenRefs.add(ref);
            yield ref;
          }
        }
      },
    };
  }

  /**
   * Iterator for all annotations of a specific type
   */
  *entriesOfType<U>(
    type: AnnotationType<U>
  ): Iterable<[Ref<any>, AnnotationValue<U>]> {
    // Only yield if requested type matches our filtered type
    if (type.id === this.#type.id) {
      yield* this.#source.entriesOfType(type);
    }
  }

  /**
   * Iterator for all annotations on a specific ref
   */
  *entriesOnRef(ref: Ref<any>): Iterable<[Ref<any>, AnnotationValue<any>]> {
    for (const [r, annotation] of this.#source.entriesOnRef(ref)) {
      if (annotation.type.id === this.#type.id) {
        yield [r, annotation];
      }
    }
  }

  /**
   * Make the view iterable
   * Uses source's entriesOfType for efficient iteration by type
   */
  *[Symbol.iterator](): Iterator<Annotation<unknown, T>> {
    for (const entry of this.#source.entriesOfType(this.#type)) {
      yield entry;
    }
  }
}
