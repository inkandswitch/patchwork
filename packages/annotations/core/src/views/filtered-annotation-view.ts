import { ObservableEventEmitter } from "@patchwork/observable";
import { type Ref } from "@patchwork/refs";
import { AnnotationType, AnnotationValue } from "../annotation-type";
import {
  Annotation,
  AnnotationChange,
  AnnotationEvents,
  AnnotationFilter,
  AnnotationSource,
} from "../types";
import { filterAnnotationChange, isChangeEmpty } from "../utils";
import { AnnotationsOfType } from "./annotations-of-type";
import { AnnotationsOnRef } from "./annotations-on-ref";

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
  #filter: AnnotationFilter;

  constructor(source: AnnotationSource, filter: AnnotationFilter) {
    super();
    this.#source = source;
    this.#filter = filter;
    this.#setupSubscription();
  }

  #setupSubscription(): void {
    const handleChange = (change: AnnotationChange) => {
      const filteredChange = filterAnnotationChange(change, this.#filter);

      if (!isChangeEmpty(filteredChange)) {
        this.emit("change", filteredChange);
        this.notifySubscribers();
      }
    };

    this.#source.on("change", handleChange);
  }

  get value(): Annotation<unknown, unknown>[] {
    return [...this];
  }

  /**
   * Filter by annotation type
   */
  ofType<T>(type: AnnotationType<T>): AnnotationsOfType<T> {
    return new AnnotationsOfType(this, type);
  }

  /**
   * Filter by exact ref match
   */
  onRef<T>(ref: Ref<T>): AnnotationsOnRef<T> {
    return new AnnotationsOnRef(this, ref);
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
      if (!this.#filter(ref, annotation)) continue;

      if (annotation.type.id === type.id) {
        return annotation.value as T;
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
      if (!this.#filter(ref, annotation)) continue;

      if (annotation.type.id === type.id) {
        result.push(annotation.value as T);
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
      if (this.#filter(ref, annotation as AnnotationValue<any>)) {
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
      if (this.#filter(r, annotation)) {
        yield [r, annotation];
      }
    }
  }

  /**
   * Iterator for all unique refs that have annotations matching the filter
   */
  get refs(): Iterable<Ref<unknown>> {
    const self = this;
    return {
      *[Symbol.iterator]() {
        const seenRefs = new Set<Ref<unknown>>();

        for (const [ref, annotation] of self.#source) {
          if (self.#filter(ref, annotation) && !seenRefs.has(ref)) {
            seenRefs.add(ref);
            yield ref;
          }
        }
      },
    };
  }

  /**
   * Make the view iterable
   * Filters the source's iterator by the predicate
   */
  *[Symbol.iterator](): Iterator<[Ref<any>, AnnotationValue<any>]> {
    for (const [ref, annotation] of this.#source) {
      if (this.#filter(ref, annotation)) {
        yield [ref, annotation];
      }
    }
  }
}
