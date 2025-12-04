import { ObservableEventEmitter } from "@patchwork/observable";
import { type Ref } from "@patchwork/refs";
import { Annotation, AnnotationSource, AnnotationEvents } from "../types";
import { AnnotationType, AnnotationValue } from "../annotation-type";

/**
 * Annotations filtered by ref
 * Allows lookup by type
 */
export class AnnotationsOnRef<T>
  extends ObservableEventEmitter<AnnotationEvents>
  implements AnnotationSource
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
    const handleChange = (annotations: Annotation[]) => {
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
    for (const [, annotation] of this.#source.entriesOnRef(this.#ref)) {
      if (annotation.type.id === type.id) {
        return annotation.value;
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
        result.push(annotation.value);
      }
    }
    return result;
  }

  /**
   * @hidden
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
   * @hidden
   * Iterator for all annotations on a specific ref
   */
  *entriesOnRef(ref: Ref<any>): Iterable<[Ref<any>, AnnotationValue<any>]> {
    // Only yield if requested ref matches our filtered ref
    if (ref === this.#ref) {
      yield* this.#source.entriesOnRef(ref);
    }
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
