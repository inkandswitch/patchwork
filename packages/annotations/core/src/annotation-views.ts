import { type Ref } from "@patchwork/refs";
import type { AnnotationType, AnnotationValue } from "./annotation-type";

/**
 * Annotations filtered by type
 * Allows lookup by ref
 */
export class AnnotationsOfType<T> {
  constructor(
    private annotationsByRef: Map<Ref, Set<T>>,
    private refsById: Map<string, Ref<any>>
  ) {}

  /**
   * Lookup the first annotation value for a ref
   */
  lookup(ref: Ref<unknown>): T | undefined {
    // use stored ref to make sure refs with the same id always resolve to the same instance
    const storedRef = this.refsById.get(ref.toString());

    if (!storedRef) return undefined;

    const annotations = this.annotationsByRef.get(storedRef);
    return annotations ? annotations.values().next().value : undefined;
  }

  /**
   * Lookup all annotation values for a ref
   */
  lookupAll(ref: Ref<unknown>): T[] {
    // use stored ref to make sure refs with the same id always resolve to the same instance
    const storedRef = this.refsById.get(ref.toString());

    if (!storedRef) return [];

    const annotations = this.annotationsByRef.get(storedRef);
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
