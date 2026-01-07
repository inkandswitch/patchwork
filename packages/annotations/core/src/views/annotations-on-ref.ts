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
 * FinalizationRegistry for automatic cleanup of AnnotationsOnRef instances.
 * Ensures subscriptions are cleaned up when views are garbage collected.
 */
const viewCleanupRegistry = new FinalizationRegistry<() => void>((cleanup) =>
  cleanup()
);

/**
 * Annotations filtered by ref
 * Allows lookup by type
 */
export class AnnotationsOnRef<T = unknown>
  extends EventEmitter<AnnotationEvents>
  implements AnnotationSource<T>, SignalObject<AnnotationsOnRef<T>>
{
  #source: AnnotationSource;
  #ref: Ref<T>;
  #subscriberSet = new SubscriberSet<AnnotationsOnRef<T>>();

  constructor(source: AnnotationSource, ref: Ref<T>) {
    super();
    this.#source = source;
    this.#ref = ref;
    const unsubscribe = this.#setupSubscription();
    viewCleanupRegistry.register(this, unsubscribe);
  }

  subscribe(callback: (value: AnnotationsOnRef<T>) => void): () => void {
    return this.#subscriberSet.add(callback);
  }

  #setupSubscription(): () => void {
    const handleChange = (change: AnnotationChange) => {
      const filteredChange = filterAnnotationChange(
        change,
        (ref) => ref === this.#ref
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
   * Lookup the first annotation value for a type
   */
  lookup<U>(type: AnnotationType<U>): U | undefined {
    for (const [, annotation] of this.#source.entriesOnRef(this.#ref)) {
      if (annotation.type.id === type.id) {
        return annotation.value as U;
      }
    }
    return undefined;
  }

  /**
   * Lookup all annotation values for a type
   */
  lookupAll<U>(type: AnnotationType<U>): U[] {
    const result: U[] = [];
    for (const [, annotation] of this.#source.entriesOnRef(this.#ref)) {
      if (annotation.type.id === type.id) {
        result.push(annotation.value as U);
      }
    }
    return result;
  }

  /**
   * Iterator for all annotations of a specific type
   */
  *entriesOfType<U>(
    type: AnnotationType<U>
  ): Iterable<[Ref<any>, AnnotationValue<U>]> {
    for (const [, annotation] of this.#source.entriesOnRef(this.#ref)) {
      if (annotation.type.id === type.id) {
        yield [this.#ref, annotation as AnnotationValue<U>];
      }
    }
  }

  /**
   * Iterator for all annotations on a specific ref
   */
  *entriesOnRef(ref: Ref<any>): Iterable<[Ref<any>, AnnotationValue<any>]> {
    // Only yield if requested ref matches our filtered ref
    if (ref === this.#ref) {
      yield* this.#source.entriesOnRef(ref);
    }
  }

  /**
   * Iterator for all refs (only yields the single ref this view is filtered to)
   */
  get refs(): Iterable<Ref<T>> {
    const ref = this.#ref;
    return {
      *[Symbol.iterator]() {
        yield ref;
      },
    };
  }

  /**
   * Make the view iterable
   * Uses source's entriesOnRef for efficient iteration by ref
   */
  *[Symbol.iterator](): Iterator<Annotation<T, unknown>> {
    for (const [, annotation] of this.#source.entriesOnRef(this.#ref)) {
      yield [this.#ref, annotation];
    }
  }
}
