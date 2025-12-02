import { type Ref } from "@patchwork/refs";
import type { AnnotationType, AnnotationValue } from "./annotation-type";
import { AnnotationsOfType, AnnotationsOnRef } from "./annotation-views";

/**
 * A set of annotations that can be queried and filtered
 *
 * Internal storage:
 * - Set of ref IDs (using ref.toString())
 * - Map: AnnotationType -> Map<refId, Set<value>>
 *
 * Each ref can have multiple annotations of the same type.
 */
export class AnnotationSet {
  // Map: AnnotationType -> Map<refId, Set<value>>
  private annotationsByType: Map<
    AnnotationType<any>,
    Map<Ref, Set<AnnotationValue<any>>>
  > = new Map();

  // Map: refId -> Ref instance (for reconstruction)
  private refsById: Map<string, Ref<any>> = new Map();

  /**
   * Add an annotation to a ref.
   * Multiple annotations of the same type can be added to the same ref.
   */
  add<T>(ref: Ref<any>, annotation: AnnotationValue<T>): void {
    const refId = ref.toString();

    // use stored ref to make sure refs with the same Id always resolve to the same instance
    let storedRef = this.refsById.get(refId);
    if (!storedRef) {
      storedRef = ref;
      this.refsById.set(refId, storedRef);
    }

    const type = annotation.type;

    let typeMap = this.annotationsByType.get(type);
    if (!typeMap) {
      typeMap = new Map();
      this.annotationsByType.set(type, typeMap);
    }

    let valueSet = typeMap.get(storedRef);
    if (!valueSet) {
      valueSet = new Set();
      typeMap.set(storedRef, valueSet);
    }

    valueSet.add(annotation);
  }

  /**
   * Filter annotations by type
   */
  ofType<T>(type: AnnotationType<T>): AnnotationsOfType<T> {
    const annoationsByRef = this.annotationsByType.get(type);

    if (!annoationsByRef) {
      return new AnnotationsOfType<T>(new Map(), new Map());
    }

    return new AnnotationsOfType<T>(
      annoationsByRef as Map<Ref, Set<T>>,
      this.refsById
    );
  }

  /**
   * Filter annotations on a specific ref (exact match)
   */
  on<T>(ref: Ref<T>): AnnotationsOnRef<T> {
    // use stored ref to make sure refs with the same id always resolve to the same instance
    const storedRef = this.refsById.get(ref.toString());

    if (!storedRef) {
      return new AnnotationsOnRef<T>(ref, new Map());
    }

    const annotationsOnRef = new Map<
      AnnotationType<any>,
      Set<AnnotationValue<any>>
    >();

    for (const [type, typeMap] of this.annotationsByType) {
      const annotations = typeMap.get(storedRef);
      if (annotations) {
        annotationsOnRef.set(type, annotations);
      }
    }

    return new AnnotationsOnRef<T>(ref, annotationsOnRef);
  }

  /**
   * Filter annotations on children of a ref (if ref is an array or text)
   * Returns a new AnnotationSet containing only the matching annotations
   */
  onChildrenOf(ref: Ref<string | Array<unknown>>): AnnotationSet {
    const newAnnotatonsByType = new Map<
      AnnotationType<any>,
      Map<Ref, Set<AnnotationValue<any>>>
    >();
    const newRefsById = new Map<string, Ref<any>>();

    for (const [type, annoationsByRef] of this.annotationsByType) {
      let newAnnoationsByRef = new Map<Ref, Set<AnnotationValue<any>>>();
      newAnnotatonsByType.set(type, newAnnoationsByRef);

      for (const [otherRef, annotations] of annoationsByRef) {
        if (otherRef.isChildOf(ref)) {
          newRefsById.set(otherRef.toString(), otherRef);
          newAnnoationsByRef.set(otherRef, annotations);
        }
      }
    }

    const newAnnotationSet = new AnnotationSet();
    newAnnotationSet.annotationsByType = newAnnotatonsByType;
    newAnnotationSet.refsById = newRefsById;

    return newAnnotationSet;
  }

  /**
   * Filter annotations anywhere on the subtree that ref points to
   * Returns a new AnnotationSet containing only the matching annotations
   */
  onPartOf(ref: Ref<unknown>): AnnotationSet {
    const newAnnotatonsByType = new Map<
      AnnotationType<any>,
      Map<Ref, Set<AnnotationValue<any>>>
    >();
    const newRefsById = new Map<string, Ref<any>>();

    for (const [type, annoationsByRef] of this.annotationsByType) {
      let newAnnoationsByRef = new Map<Ref, Set<AnnotationValue<any>>>();
      newAnnotatonsByType.set(type, newAnnoationsByRef);

      for (const [otherRef, annotations] of annoationsByRef) {
        if (otherRef.isChildOf(ref)) {
          newRefsById.set(otherRef.toString(), otherRef);
          newAnnoationsByRef.set(otherRef, annotations);
        }
      }
    }

    const newAnnotationSet = new AnnotationSet();
    newAnnotationSet.annotationsByType = newAnnotatonsByType;
    newAnnotationSet.refsById = newRefsById;

    return newAnnotationSet;
  }

  /**
   * Make the annotation set iterable
   */
  *[Symbol.iterator](): Iterator<[Ref<unknown>, AnnotationValue<any>]> {
    for (const [type, annoationsByRef] of this.annotationsByType) {
      for (const [ref, annotations] of annoationsByRef) {
        for (const annotation of annotations) {
          yield [ref, annotation];
        }
      }
    }
  }
}
