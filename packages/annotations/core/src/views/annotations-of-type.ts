import { ObservableEventEmitter } from "@patchwork/observable";
import { type Ref } from "@patchwork/refs";
import {
  AnnotationCollection,
  AnnotationEvents,
  AnnotationSource,
} from "../types";
import { AnnotationType, AnnotationValue } from "../annotation-type";

/**
 * Annotations filtered by type
 * Allows lookup by ref
 */
export class AnnotationsOfType<T>
  extends ObservableEventEmitter<AnnotationEvents>
  implements AnnotationCollection
{
  #source: AnnotationSource;
  #type: AnnotationType<T>;

  constructor(source: AnnotationSource, type: AnnotationType<T>) {
    super();
    this.#source = source;
    this.#type = type;
    this.#setupSubscription();
  }

  #setupSubscription(): void {
    // Subscribe to source changes
    const handleChange = (annotations: AnnotationCollection) => {
      // Only notify if the change is relevant to our type
      for (const [, annotation] of annotations) {
        if (annotation.type.id === this.#type.id) {
          this.notifySubscribers();
          return;
        }
      }
    };

    this.#source.on("added", handleChange);
    this.#source.on("removed", handleChange);
  }

  /**
   * Lookup the first annotation value for a ref
   */
  lookup(ref: Ref<unknown>): T | undefined {
    return this.#source.lookup(ref, this.#type);
  }

  /**
   * Lookup all annotation values for a ref
   */
  lookupAll(ref: Ref<unknown>): T[] {
    return this.#source.lookupAll(ref, this.#type);
  }

  /**
   * Make the view iterable
   * Uses source's entriesOfType for efficient iteration by type
   */
  *[Symbol.iterator](): Iterator<[Ref<any>, AnnotationValue<unknown>]> {
    for (const entry of this.#source.entriesOfType(this.#type)) {
      yield entry as [Ref<any>, AnnotationValue<unknown>];
    }
  }
}
