import { ObservableEventEmitter } from "@patchwork/observable";
import { type Ref } from "@patchwork/refs";
import { AnnotationType, AnnotationValue } from "../annotation-type";
import { Annotation, AnnotationSource, AnnotationEvents } from "../types";

/**
 * A generic filtered view of annotations based on a predicate.
 * Cannot add or remove annotations, but can further filter with ofType, onRef, etc.
 * Uses lazy iteration - no intermediate data structures are created.
 */
export class FilteredAnnotationView
  extends ObservableEventEmitter<AnnotationEvents>
  implements AnnotationSource
{
  #source: AnnotationSource;
  #predicate: AnnotationPredicate;

  constructor(source: AnnotationSource, predicate: AnnotationPredicate) {
    super();
    this.#source = source;
    this.#predicate = predicate;
    this.#setupSubscription();
  }

  #setupSubscription(): void {
    const handleChange = (annotations: Annotation[]) => {
      // Only notify if any changed annotation matches our predicate
      for (const [ref, annotation] of annotations) {
        if (this.#predicate(ref, annotation)) {
          this.notifySubscribers();
          return;
        }
      }
    };

    this.#source.on("added", handleChange);
    this.#source.on("removed", handleChange);
  }

  /**
   * Filter by annotation type
   */
  ofType<T>(type: AnnotationType<T>): FilteredAnnotationView {
    return new FilteredAnnotationView(
      this,
      (_, annotation) => annotation.type.id === type.id
    );
  }

  /**
   * Filter by exact ref match
   */
  onRef<T>(ref: Ref<T>): FilteredAnnotationView {
    return new FilteredAnnotationView(this, (otherRef, _) => otherRef === ref);
  }

  /**
   * Filter to direct children of a ref (for arrays/text)
   */
  onChildrenOf(ref: Ref<string | Array<unknown>>): FilteredAnnotationView {
    return new FilteredAnnotationView(this, (otherRef, _) =>
      otherRef.isChildOf(ref)
    );
  }

  /**
   * Filter to the subtree under a ref (ref itself and all descendants)
   */
  onPartOf(ref: Ref<unknown>): FilteredAnnotationView {
    return new FilteredAnnotationView(this, (otherRef, _) =>
      ref.contains(otherRef)
    );
  }

  /**
   * @hidden
   * Lookup the first annotation value for a ref and type
   */
  lookup<T>(ref: Ref<any>, type: AnnotationType<T>): T | undefined {
    for (const [, annotation] of this.#source.entriesOnRef(ref)) {
      if (!this.#predicate(ref, annotation)) continue;

      if (annotation.type.id === type.id) {
        return annotation.value;
      }
    }
    return undefined;
  }

  /**
   * @hidden
   * Lookup all annotation values for a ref and type
   */
  lookupAll<T>(ref: Ref<any>, type: AnnotationType<T>): T[] {
    const result: T[] = [];
    for (const [, annotation] of this.#source.entriesOnRef(ref)) {
      if (!this.#predicate(ref, annotation)) continue;

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
  *entriesOfType<T>(
    type: AnnotationType<T>
  ): Iterable<[Ref<any>, AnnotationValue<T>]> {
    for (const [ref, annotation] of this.#source.entriesOfType(type)) {
      if (this.#predicate(ref, annotation as AnnotationValue<any>)) {
        yield [ref, annotation];
      }
    }
  }

  /**
   * @hidden
   * Iterator for all annotations on a specific ref
   */
  *entriesOnRef(ref: Ref<any>): Iterable<[Ref<any>, AnnotationValue<any>]> {
    for (const [r, annotation] of this.#source.entriesOnRef(ref)) {
      if (this.#predicate(r, annotation)) {
        yield [r, annotation];
      }
    }
  }

  /**
   * Make the view iterable
   * Filters the source's iterator by the predicate
   */
  *[Symbol.iterator](): Iterator<[Ref<any>, AnnotationValue<any>]> {
    for (const [ref, annotation] of this.#source) {
      if (this.#predicate(ref, annotation)) {
        yield [ref, annotation];
      }
    }
  }
}

/**
 * Predicate function for filtering annotations
 */
export type AnnotationPredicate<
  RefType = unknown,
  AnnotationValueType = unknown,
> = (
  ref: Ref<RefType>,
  annotation: AnnotationValue<AnnotationValueType>
) => boolean;
