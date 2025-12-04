import { ObservableEventEmitter } from "@patchwork/observable";
import { type Ref } from "@patchwork/refs";
import {
  AnnotationCollection,
  AnnotationEvents,
  AnnotationSource,
} from "../types";
import { AnnotationType, AnnotationValue } from "../annotation-type";

/**
 * Annotations filtered by ref
 * Allows lookup by type
 */
export class AnnotationsOnRef<T>
  extends ObservableEventEmitter<AnnotationEvents>
  implements AnnotationCollection
{
  #source: AnnotationSource;
  #ref: Ref<T>;

  constructor(source: AnnotationSource, ref: Ref<T>) {
    super();
    this.#source = source;
    this.#ref = ref;
    this.#setupSubscription();
  }

  #setupSubscription(): void {
    // Subscribe to source changes
    const handleChange = (annotations: AnnotationCollection) => {
      // Only notify if the change is relevant to our ref
      for (const [ref] of annotations) {
        if (ref === this.#ref) {
          this.notifySubscribers();
          return;
        }
      }
    };

    this.#source.on("added", handleChange);
    this.#source.on("removed", handleChange);
  }

  /**
   * Lookup the first annotation value for a type
   */
  lookup<U>(type: AnnotationType<U>): U | undefined {
    return this.#source.lookup(this.#ref, type);
  }

  /**
   * Lookup all annotation values for a type
   */
  lookupAll<U>(type: AnnotationType<U>): U[] {
    return this.#source.lookupAll(this.#ref, type);
  }

  /**
   * Make the view iterable
   * Uses source's entriesOnRef for efficient iteration by ref
   */
  *[Symbol.iterator](): Iterator<[Ref<T>, AnnotationValue<unknown>]> {
    for (const [, annotation] of this.#source.entriesOnRef(this.#ref)) {
      yield [this.#ref, annotation];
    }
  }
}
