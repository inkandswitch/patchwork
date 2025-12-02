import { type Ref } from "@patchwork/refs";
import type { AnnotationType, AnnotationValue } from "./annotation-type";
import { AnnotationSet } from "./annotation-set";

/**
 * Annotations filtered by type
 * Allows lookup by ref
 */
export class AnnotationsOfType<T> {
  constructor(
    private annotationSet: AnnotationSet,
    private annotationsByRef: Map<Ref, Set<T>>
  ) {}

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
  *[Symbol.iterator](): Iterator<[Ref<any>, T]> {
    for (const [ref, annotations] of this.annotationsByRef) {
      for (const annotation of annotations) {
        yield [ref, annotation];
      }
    }
  }
}

/**
 * Annotations filtered by ref
 * Allows lookup by type
 */
export class AnnotationsOnRef<T> {
  constructor(
    private annotationSet: AnnotationSet,
    private ref: Ref<T>,
    private annotationsByType: Map<
      AnnotationType<any>,
      Set<AnnotationValue<any>>
    >
  ) {}

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
  *[Symbol.iterator](): Iterator<AnnotationValue<any>> {
    for (const annotations of this.annotationsByType.values()) {
      for (const annotation of annotations) {
        yield annotation;
      }
    }
  }
}
