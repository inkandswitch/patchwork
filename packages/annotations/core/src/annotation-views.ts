import { type Ref } from "@patchwork/refs";
import type { AnnotationType, AnnotationValue } from "./annotation-type";
import { AnnotationSet } from "./annotation-set";
import { ObservableEventEmitter } from "@patchwork/observable";
import { AnnotationsCollection } from "./annotation-collection";

/**
 * Annotations filtered by type
 * Allows lookup by ref
 */
export class AnnotationsOfType<T>
  extends ObservableEventEmitter
  implements AnnotationsCollection
{
  private type?: AnnotationType<T>;

  constructor(
    private annotationSet: AnnotationSet,
    private annotationsByRef: Map<Ref, Set<T>>,
    type?: AnnotationType<T>
  ) {
    super();
    this.type = type;
    this.setupSubscription();
  }

  private setupSubscription(): void {
    // Subscribe to annotation set changes
    const handleChange = (annotations: AnnotationsCollection) => {
      // Only notify if the change is relevant to our type
      for (const [, annotation] of annotations) {
        if (this.type && annotation.type === this.type) {
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
   */
  lookup(ref: Ref<unknown>): T | undefined {
    const annotations = this.annotationsByRef.get(ref);
    return annotations ? annotations.values().next().value : undefined;
  }

  /**
   * Lookup all annotation values for a ref
   */
  lookupAll(ref: Ref<unknown>): T[] {
    const annotations = this.annotationsByRef.get(ref);
    return annotations ? Array.from(annotations) : [];
  }

  /**
   * Make the view iterable
   */
  // todo: fix types
  *[Symbol.iterator](): Iterator<[Ref<any>, AnnotationValue<unknown>]> {
    for (const [ref, annotations] of this.annotationsByRef) {
      for (const annotation of annotations) {
        yield [ref, annotation as AnnotationValue<unknown>];
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
  implements AnnotationsCollection
{
  private unsubscribeFromSet?: () => void;

  constructor(
    private annotationSet: AnnotationSet,
    private ref: Ref<T>,
    private annotationsByType: Map<
      AnnotationType<any>,
      Set<AnnotationValue<any>>
    >
  ) {
    super();
    this.setupSubscription();
  }

  private setupSubscription(): void {
    // Subscribe to annotation set changes
    const handleChange = (annotations: AnnotationsCollection) => {
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

    // Store unsubscribe function
    this.unsubscribeFromSet = () => {
      this.annotationSet.off("added", handleChange);
      this.annotationSet.off("removed", handleChange);
    };
  }

  /**
   * Lookup the first annotation value for a type
   */
  lookup<T>(type: AnnotationType<T>): T | undefined {
    const annotationsOfType = this.annotationsByType.get(type);
    return annotationsOfType?.values().next().value as T;
  }

  /**
   * Lookup all annotation values for a type
   */
  lookupAll<T>(type: AnnotationType<T>): T[] {
    const annotationsOfType = this.annotationsByType.get(type);
    return annotationsOfType ? Array.from(annotationsOfType as Set<T>) : [];
  }

  /**
   * Make the view iterable
   */
  // todo: fix types
  *[Symbol.iterator](): Iterator<[Ref<any>, AnnotationValue<unknown>]> {
    for (const annotations of this.annotationsByType.values()) {
      for (const annotation of annotations) {
        yield [this.ref, annotation as AnnotationValue<unknown>];
      }
    }
  }
}
