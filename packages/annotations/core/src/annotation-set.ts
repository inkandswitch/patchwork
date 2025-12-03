import { Ref } from "@patchwork/refs";
import type { AnnotationType, AnnotationValue } from "./annotation-type";
import { AnnotationsOfType, AnnotationsOnRef } from "./annotation-views";
import { ObservableEventEmitter } from "@patchwork/observable";
import { AnnotationEvents } from "./annotation-events";
import { AnnotationsCollection } from "./annotation-collection";

/**
 * A set of annotations that can be queried and filtered
 *
 * Internal storage:
 * - Map: AnnotationType -> Map<Ref, Set<value>>
 * - Map: Ref -> Set<AnnotationType> (for tracking which types each ref has)
 *
 * Each ref can have multiple annotations of the same type.
 */
export class AnnotationSet
  extends ObservableEventEmitter<AnnotationEvents>
  implements AnnotationsCollection
{
  // Map: AnnotationType -> Map<Ref, Set<value>>
  private annotationsByType: Map<
    AnnotationType<any>,
    Map<Ref, Set<AnnotationValue<any>>>
  > = new Map();

  // Map: Ref -> Set<AnnotationType> (tracks which annotation types each ref has)
  private annotationTypesByRef: Map<Ref, Set<AnnotationType<any>>> = new Map();

  /**
   * Add an annotation to a ref.
   * Multiple annotations of the same type can be added to the same ref.
   */
  add<T>(ref: Ref<any>, annotation: AnnotationValue<T>): void {
    const type = annotation.type;

    // Add to annotationsByType
    let typeMap = this.annotationsByType.get(type);
    if (!typeMap) {
      typeMap = new Map();
      this.annotationsByType.set(type, typeMap);
    }

    let valueSet = typeMap.get(ref);
    if (!valueSet) {
      valueSet = new Set();
      typeMap.set(ref, valueSet);
    }

    valueSet.add(annotation);

    // Track that this ref has this annotation type
    let typesForRef = this.annotationTypesByRef.get(ref);
    if (!typesForRef) {
      typesForRef = new Set();
      this.annotationTypesByRef.set(ref, typesForRef);
    }
    typesForRef.add(type);

    // Emit event and notify subscribers
    this.emit("added", new ReadOnlyAnnotationSet([[ref, annotation]]));
    this.notifySubscribers();
  }

  /**
   * Remove all annotations of a specific type across all refs
   */
  remove<T>(annotationType: AnnotationType<T>): void;

  /**
   * Remove all annotations for a ref
   */
  remove(ref: Ref<any>): void;

  /**
   * Remove all annotations of a specific type for a ref
   */
  remove<T>(ref: Ref<any>, annotationType: AnnotationType<T>): void;

  remove<T>(
    refOrAnnotationType: Ref<any> | AnnotationType<T>,
    annotationType?: AnnotationType<T>
  ): void {
    let removed: [Ref, AnnotationValue<any>][];

    if (refOrAnnotationType instanceof Ref) {
      if (annotationType) {
        removed = this.#removeTypeFromRef(refOrAnnotationType, annotationType);
      } else {
        removed = this.#removeAllFromRef(refOrAnnotationType);
      }
    } else {
      removed = this.#removeType(refOrAnnotationType);
    }

    // Emit event for all removed annotations
    if (removed.length > 0) {
      this.emit("removed", new ReadOnlyAnnotationSet(removed));
      this.notifySubscribers();
    }
  }

  /**
   * Remove all annotations for a ref
   */
  #removeAllFromRef(ref: Ref<any>): Array<[Ref, AnnotationValue<any>]> {
    const annotationTypes = this.annotationTypesByRef.get(ref);
    if (!annotationTypes) {
      return [];
    }

    const removed: Array<[Ref, AnnotationValue<any>]> = [];

    for (const type of annotationTypes) {
      const annotations = this.annotationsByType.get(type);
      if (annotations) {
        const annotationsForRef = annotations.get(ref);
        if (annotationsForRef) {
          for (const annotation of annotationsForRef) {
            removed.push([ref, annotation]);
          }
        }
        annotations.delete(ref);
      }
    }

    this.annotationTypesByRef.delete(ref);
    return removed;
  }

  /**
   * Remove all annotations of a specific type for a ref
   */
  #removeTypeFromRef<T>(
    ref: Ref<any>,
    type: AnnotationType<T>
  ): Array<[Ref, AnnotationValue<any>]> {
    const annotations = this.annotationsByType.get(type);
    if (!annotations) {
      return [];
    }

    const removed: Array<[Ref, AnnotationValue<any>]> = [];
    const annotationsForRef = annotations.get(ref);
    if (annotationsForRef) {
      for (const annotation of annotationsForRef) {
        removed.push([ref, annotation]);
      }
    }

    annotations.delete(ref);
    this.annotationTypesByRef.get(ref)?.delete(type);

    return removed;
  }

  /**
   * Remove all annotations of a specific type across all refs
   */
  #removeType<T>(type: AnnotationType<T>): Array<[Ref, AnnotationValue<any>]> {
    const annotationsByRef = this.annotationsByType.get(type);
    if (!annotationsByRef) {
      return [];
    }

    const removed: Array<[Ref, AnnotationValue<any>]> = [];
    for (const [ref, annotations] of annotationsByRef) {
      for (const annotation of annotations) {
        removed.push([ref, annotation]);
      }
      this.annotationTypesByRef.get(ref)?.delete(type);
    }

    this.annotationsByType.delete(type);
    return removed;
  }

  /**
   * Filter annotations by type
   */
  ofType<T>(type: AnnotationType<T>): AnnotationsOfType<T> {
    const annotationsByRef = this.annotationsByType.get(type) as Map<
      Ref,
      Set<T>
    >;

    if (!annotationsByRef) {
      return new AnnotationsOfType<T>(this, new Map(), type);
    }

    return new AnnotationsOfType<T>(this, annotationsByRef, type);
  }

  /**
   * Filter annotations on a specific ref (exact match)
   */
  onRef<T>(ref: Ref<T>): AnnotationsOnRef<T> {
    const typesForRef = this.annotationTypesByRef.get(ref);

    if (!typesForRef) {
      return new AnnotationsOnRef<T>(this, ref, new Map());
    }

    const annotationsOnRef = new Map<
      AnnotationType<any>,
      Set<AnnotationValue<any>>
    >();

    for (const type of typesForRef) {
      const typeMap = this.annotationsByType.get(type);
      if (typeMap) {
        const annotations = typeMap.get(ref);
        if (annotations) {
          annotationsOnRef.set(type, annotations);
        }
      }
    }

    return new AnnotationsOnRef<T>(this, ref, annotationsOnRef);
  }

  /**
   * Filter annotations on children of a ref (if ref is an array or text)
   * Returns a new AnnotationSet containing only the matching annotations
   */
  onChildrenOf(ref: Ref<string | Array<unknown>>): AnnotationSet {
    const newAnnotationsByType = new Map<
      AnnotationType<any>,
      Map<Ref, Set<AnnotationValue<any>>>
    >();
    const newAnnotationTypesByRef = new Map<Ref, Set<AnnotationType<any>>>();

    for (const [type, annotationsByRef] of this.annotationsByType) {
      let newAnnotationsByRef = new Map<Ref, Set<AnnotationValue<any>>>();
      newAnnotationsByType.set(type, newAnnotationsByRef);

      for (const [otherRef, annotations] of annotationsByRef) {
        if (otherRef.isChildOf(ref)) {
          // add annotation to ref
          newAnnotationsByRef.set(otherRef, annotations);

          // track that annotation has this type
          let typesForRef = newAnnotationTypesByRef.get(otherRef);
          if (!typesForRef) {
            typesForRef = new Set();
            newAnnotationTypesByRef.set(otherRef, typesForRef);
          }
          typesForRef.add(type);
        }
      }
    }

    const newAnnotationSet = new AnnotationSet();
    newAnnotationSet.annotationsByType = newAnnotationsByType;
    newAnnotationSet.annotationTypesByRef = newAnnotationTypesByRef;

    return newAnnotationSet;
  }

  /**
   * Filter annotations anywhere on the subtree that ref points to
   * Returns a new AnnotationSet containing only the matching annotations
   */
  onPartOf(ref: Ref<unknown>): AnnotationSet {
    const newAnnotationsByType = new Map<
      AnnotationType<any>,
      Map<Ref, Set<AnnotationValue<any>>>
    >();
    const newAnnotationTypesByRef = new Map<Ref, Set<AnnotationType<any>>>();

    for (const [type, annotationsByRef] of this.annotationsByType) {
      let newAnnotationsByRef = new Map<Ref, Set<AnnotationValue<any>>>();
      newAnnotationsByType.set(type, newAnnotationsByRef);

      for (const [otherRef, annotations] of annotationsByRef) {
        if (otherRef.isChildOf(ref)) {
          // add annotation to ref
          newAnnotationsByRef.set(otherRef, annotations);

          // track that annotation has this type
          let typesForRef = newAnnotationTypesByRef.get(otherRef);
          if (!typesForRef) {
            typesForRef = new Set();
            newAnnotationTypesByRef.set(otherRef, typesForRef);
          }
          typesForRef.add(type);
        }
      }
    }

    const newAnnotationSet = new AnnotationSet();
    newAnnotationSet.annotationsByType = newAnnotationsByType;
    newAnnotationSet.annotationTypesByRef = newAnnotationTypesByRef;

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

/**
 * Internal class for passing annotation collections (e.g., in event payloads).
 * Not exposed to users - only visible as AnnotationsCollection interface.
 */
export class ReadOnlyAnnotationSet implements AnnotationsCollection {
  #entries: [ref: Ref, annotation: AnnotationValue<any>][] = [];

  constructor(entries: [ref: Ref, annotation: AnnotationValue<any>][]) {
    this.#entries = entries;
  }

  *[Symbol.iterator](): Iterator<[Ref<unknown>, AnnotationValue<any>]> {
    for (const [ref, annotation] of this.#entries) {
      yield [ref, annotation];
    }
  }
}
