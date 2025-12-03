import { type Ref } from "@patchwork/refs";
import type { AnnotationType, AnnotationValue } from "./annotation-type";
import { AnnotationSet } from "./annotation-set";
import { ObservableEventEmitter } from "@patchwork/observable";
import { AnnotationCollection } from "./annotation-collection";

/**
 * Annotations filtered by type
 * Allows lookup by ref
 */
export class AnnotationsOfType<T>
  extends ObservableEventEmitter
  implements AnnotationCollection
{
  private type: AnnotationType<T>;

  constructor(
    private annotationSet: AnnotationSet,
    type: AnnotationType<T>
  ) {
    super();
    this.type = type;
    this.setupSubscription();
  }

  private setupSubscription(): void {
    // Subscribe to annotation set changes
    const handleChange = (annotations: AnnotationCollection) => {
      // Only notify if the change is relevant to our type
      for (const [, annotation] of annotations) {
        if (annotation.type.id === this.type.id) {
          this.notifySubscribers();
          return;
        }
      }
    };

    this.annotationSet.on("added", handleChange);
    this.annotationSet.on("removed", handleChange);
  }

  /**
   * Lookup the first annotation value for a ref
   * Delegates to the annotation set's lookup
   */
  lookup(ref: Ref<unknown>): T | undefined {
    return this.annotationSet.lookup(ref, this.type);
  }

  /**
   * Lookup all annotation values for a ref
   * Delegates to the annotation set's lookupAll
   */
  lookupAll(ref: Ref<unknown>): T[] {
    return this.annotationSet.lookupAll(ref, this.type);
  }

  /**
   * Make the view iterable
   * Filters the annotation set's iterator by type
   */
  *[Symbol.iterator](): Iterator<[Ref<any>, AnnotationValue<unknown>]> {
    for (const [ref, annotation] of this.annotationSet) {
      if (annotation.type.id === this.type.id) {
        yield [ref, annotation];
      }
    }
  }
}

/**
 * Annotations filtered by ref
 * Allows lookup by type
 */
export class AnnotationsOnRef<T>
  extends ObservableEventEmitter
  implements AnnotationCollection
{
  constructor(
    private annotationSet: AnnotationSet,
    private ref: Ref<T>
  ) {
    super();
    this.setupSubscription();
  }

  private setupSubscription(): void {
    // Subscribe to annotation set changes
    const handleChange = (annotations: AnnotationCollection) => {
      // Only notify if the change is relevant to our ref
      for (const [ref] of annotations) {
        if (ref === this.ref) {
          this.notifySubscribers();
          return;
        }
      }
    };

    this.annotationSet.on("added", handleChange);
    this.annotationSet.on("removed", handleChange);
  }

  /**
   * Lookup the first annotation value for a type
   * Delegates to the annotation set's lookup
   */
  lookup<U>(type: AnnotationType<U>): U | undefined {
    return this.annotationSet.lookup(this.ref, type);
  }

  /**
   * Lookup all annotation values for a type
   * Delegates to the annotation set's lookupAll
   */
  lookupAll<U>(type: AnnotationType<U>): U[] {
    return this.annotationSet.lookupAll(this.ref, type);
  }

  /**
   * Make the view iterable
   * Filters the annotation set's iterator by ref
   */
  *[Symbol.iterator](): Iterator<[Ref<T>, AnnotationValue<unknown>]> {
    for (const [ref, annotation] of this.annotationSet) {
      if (ref === this.ref) {
        yield [this.ref, annotation];
      }
    }
  }
}
