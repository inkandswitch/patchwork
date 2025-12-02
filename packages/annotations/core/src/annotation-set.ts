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
   * Remove all annotations for a ref
   */
  remove(ref: Ref<any>): void;

  /**
   * Remove all annotations of a specific type for a ref
   */
  remove<T>(ref: Ref<any>, annotationType: AnnotationType<T>): void;

  /**
   * Remove a specific annotation value from a ref
   */
  remove<T>(ref: Ref<any>, annotationValue: AnnotationValue<T>): void;

  remove<T>(
    ref: Ref<any>,
    annotationTypeOrValue?: AnnotationType<T> | AnnotationValue<T>
  ): void {
    const refId = ref.toString();
    const storedRef = this.refsById.get(refId);

    if (!storedRef) {
      // Ref not found, nothing to remove
      return;
    }

    // Case 1: remove(ref) - Remove all annotations for this ref
    if (annotationTypeOrValue === undefined) {
      for (const [type, typeMap] of this.annotationsByType) {
        typeMap.delete(storedRef);
      }
      this.refsById.delete(refId);
      return;
    }

    if ("type" in annotationTypeOrValue) {
      // Case 2: remove(ref, annotationValue) - Remove specific annotation value
      const annotationValue = annotationTypeOrValue as AnnotationValue<T>;
      const type = annotationValue.type;
      const typeMap = this.annotationsByType.get(type);

      if (typeMap) {
        const valueSet = typeMap.get(storedRef);
        if (valueSet) {
          valueSet.delete(annotationValue);

          // Clean up empty sets and maps
          if (valueSet.size === 0) {
            typeMap.delete(storedRef);
          }
        }
      }
    } else {
      // Case 3: remove(ref, annotationType) - Remove all annotations of a specific type
      const annotationType = annotationTypeOrValue as AnnotationType<T>;
      const typeMap = this.annotationsByType.get(annotationType);

      if (typeMap) {
        typeMap.delete(storedRef);
      }
    }
  }

  /**
   * Filter annotations by type
   */
  ofType<T>(type: AnnotationType<T>): AnnotationsOfType<T> {
    const annoationsByRef = this.annotationsByType.get(type);

    if (!annoationsByRef) {
      return new AnnotationsOfType<T>(this, new Map(), new Map());
    }

    return new AnnotationsOfType<T>(
      this,
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
      return new AnnotationsOnRef<T>(this, ref, new Map());
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

    return new AnnotationsOnRef<T>(this, ref, annotationsOnRef);
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
