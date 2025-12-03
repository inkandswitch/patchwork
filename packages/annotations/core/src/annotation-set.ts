import { Ref } from "@patchwork/refs";
import type { AnnotationType, AnnotationValue } from "./annotation-type";
import { AnnotationsOfType, AnnotationsOnRef } from "./annotation-views";
import { ObservableEventEmitter } from "@patchwork/observable";
import { AnnotationEvents } from "./annotation-events";
import { AnnotationCollection } from "./annotation-collection";

/**
 * A set of annotations that can be queried and filtered
 *
 * Internal storage:
 * - Map: AnnotationType -> Map<Ref, Set<value>>
 * - Map: Ref -> Set<AnnotationType> (for tracking which types each ref has)
 * - Array of sub-annotation sets (for composing annotation sets)
 *
 * Each ref can have multiple annotations of the same type.
 */
export class AnnotationSet
  extends ObservableEventEmitter<AnnotationEvents>
  implements AnnotationCollection
{
  // Map: AnnotationType -> Map<Ref, Set<value>>
  #annotationsByType: Map<
    AnnotationType<any>,
    Map<Ref, Set<AnnotationValue<any>>>
  > = new Map();

  // Map: Ref -> Set<AnnotationType> (tracks which annotation types each ref has)
  #annotationTypesByRef: Map<Ref, Set<AnnotationType<any>>> = new Map();

  // Sub-annotation sets that are included in this set
  #subSets: AnnotationSet[] = [];

  /**
   * Add an annotation set as a sub-set
   */
  add(annotationSet: AnnotationSet): void;

  /**
   * Add an annotation to a ref.
   * Multiple annotations of the same type can be added to the same ref.
   */
  add<T>(ref: Ref<any>, annotation: AnnotationValue<T>): void;

  /**
   * Add multiple annotations to a ref.
   */
  add(ref: Ref<any>, annotations: AnnotationValue<any>[]): void;

  add<T>(
    refOrSet: Ref<any> | AnnotationSet,
    annotation?: AnnotationValue<T> | AnnotationValue<any>[]
  ): void {
    let added: [Ref, AnnotationValue<any>][];

    // Case: Adding an AnnotationSet as a sub-set
    if (refOrSet instanceof AnnotationSet) {
      added = this.#addAnnotationSet(refOrSet);
    }
    // Case: Adding multiple annotations
    else if (Array.isArray(annotation)) {
      added = [];
      for (const ann of annotation) {
        added.push(this.#addSingleAnnotation(refOrSet, ann));
      }
    }
    // Case: Adding a single annotation
    else if (annotation) {
      added = [this.#addSingleAnnotation(refOrSet, annotation)];
    } else {
      return;
    }

    // Emit events in one place
    if (added.length > 0) {
      this.emit("added", new ReadOnlyAnnotationSet(added));
      this.notifySubscribers();
    }
  }

  /**
   * Internal helper to add an annotation set as a sub-set
   * Returns the entries that were added (existing annotations in the sub-set)
   */
  #addAnnotationSet(
    annotationSet: AnnotationSet
  ): [Ref, AnnotationValue<any>][] {
    this.#subSets.push(annotationSet);

    // Forward events from sub-set
    annotationSet.on("added", (annotations) => {
      this.emit("added", annotations);
      this.notifySubscribers();
    });
    annotationSet.on("removed", (annotations) => {
      this.emit("removed", annotations);
      this.notifySubscribers();
    });

    // Collect all existing annotations in the sub-set
    const entries: [Ref, AnnotationValue<any>][] = [];
    for (const [ref, ann] of annotationSet) {
      entries.push([ref, ann]);
    }
    return entries;
  }

  /**
   * Internal helper to add a single annotation without emitting events
   * Returns the entry that was added
   */
  #addSingleAnnotation<T>(
    ref: Ref<any>,
    annotation: AnnotationValue<T>
  ): [Ref, AnnotationValue<any>] {
    const type = annotation.type;

    // Add to annotationsByType
    let typeMap = this.#annotationsByType.get(type);
    if (!typeMap) {
      typeMap = new Map();
      this.#annotationsByType.set(type, typeMap);
    }

    let valueSet = typeMap.get(ref);
    if (!valueSet) {
      valueSet = new Set();
      typeMap.set(ref, valueSet);
    }

    valueSet.add(annotation);

    // Track that this ref has this annotation type
    let typesForRef = this.#annotationTypesByRef.get(ref);
    if (!typesForRef) {
      typesForRef = new Set();
      this.#annotationTypesByRef.set(ref, typesForRef);
    }
    typesForRef.add(type);

    return [ref, annotation];
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
    const annotationTypes = this.#annotationTypesByRef.get(ref);
    const removed: Array<[Ref, AnnotationValue<any>]> = [];

    if (annotationTypes) {
      for (const type of annotationTypes) {
        const annotations = this.#annotationsByType.get(type);
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
    }

    this.#annotationTypesByRef.delete(ref);

    // Cascade to subsets
    for (const subSet of this.#subSets) {
      subSet.remove(ref);
    }

    return removed;
  }

  /**
   * Remove all annotations of a specific type for a ref
   */
  #removeTypeFromRef<T>(
    ref: Ref<any>,
    type: AnnotationType<T>
  ): Array<[Ref, AnnotationValue<any>]> {
    const removed: Array<[Ref, AnnotationValue<any>]> = [];

    const annotations = this.#annotationsByType.get(type);
    if (annotations) {
      const annotationsForRef = annotations.get(ref);
      if (annotationsForRef) {
        for (const annotation of annotationsForRef) {
          removed.push([ref, annotation]);
        }
      }

      annotations.delete(ref);
      this.#annotationTypesByRef.get(ref)?.delete(type);
    }

    // Cascade to subsets
    for (const subSet of this.#subSets) {
      subSet.remove(ref, type);
    }

    return removed;
  }

  /**
   * Remove all annotations of a specific type across all refs
   */
  #removeType<T>(type: AnnotationType<T>): Array<[Ref, AnnotationValue<any>]> {
    const removed: Array<[Ref, AnnotationValue<any>]> = [];

    const annotationsByRef = this.#annotationsByType.get(type);
    if (annotationsByRef) {
      for (const [ref, annotations] of annotationsByRef) {
        for (const annotation of annotations) {
          removed.push([ref, annotation]);
        }
        this.#annotationTypesByRef.get(ref)?.delete(type);
      }

      this.#annotationsByType.delete(type);
    }

    // Cascade to subsets
    for (const subSet of this.#subSets) {
      subSet.remove(type);
    }

    return removed;
  }

  /**
   * Filter annotations by type
   */
  ofType<T>(type: AnnotationType<T>): AnnotationsOfType<T> {
    return new AnnotationsOfType<T>(this, type);
  }

  /**
   * Filter annotations on a specific ref (exact match)
   */
  onRef<T>(ref: Ref<T>): AnnotationsOnRef<T> {
    return new AnnotationsOnRef<T>(this, ref);
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

    for (const [type, annotationsByRef] of this.#annotationsByType) {
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
    newAnnotationSet.#annotationsByType = newAnnotationsByType;
    newAnnotationSet.#annotationTypesByRef = newAnnotationTypesByRef;

    return newAnnotationSet;
  }

  /**
   * Filter annotations anyw  here on the subtree that ref points to
   * Returns a new AnnotationSet containing only the matching annotations
   */
  onPartOf(ref: Ref<unknown>): AnnotationSet {
    const newAnnotationsByType = new Map<
      AnnotationType<any>,
      Map<Ref, Set<AnnotationValue<any>>>
    >();
    const newAnnotationTypesByRef = new Map<Ref, Set<AnnotationType<any>>>();

    for (const [type, annotationsByRef] of this.#annotationsByType) {
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
    newAnnotationSet.#annotationsByType = newAnnotationsByType;
    newAnnotationSet.#annotationTypesByRef = newAnnotationTypesByRef;

    return newAnnotationSet;
  }

  /**
   * Lookup the first annotation value for a ref and type
   */
  lookup<T>(ref: Ref<any>, type: AnnotationType<T>): T | undefined;

  /**
   * Lookup the first annotation for a ref (across all types)
   */
  lookup(ref: Ref<any>): AnnotationValue<any> | undefined;

  lookup<T>(
    ref: Ref<any>,
    type?: AnnotationType<T>
  ): T | undefined | AnnotationValue<any> | undefined {
    if (type) {
      return this.#lookupByType(ref, type);
    } else {
      return this.#lookupAny(ref);
    }
  }

  /**
   * Lookup the first annotation value for a ref and specific type
   */
  #lookupByType<T>(ref: Ref<any>, type: AnnotationType<T>): T | undefined {
    const typeMap = this.#annotationsByType.get(type);
    if (typeMap) {
      const annotations = typeMap.get(ref);
      if (annotations) {
        const first = annotations.values().next().value;
        if (first) return first.value;
      }
    }
    // Check sub-sets
    for (const subSet of this.#subSets) {
      const result = subSet.lookup(ref, type);
      if (result !== undefined) return result;
    }
    return undefined;
  }

  /**
   * Lookup the first annotation for a ref (any type)
   */
  #lookupAny(ref: Ref<any>): AnnotationValue<any> | undefined {
    const typesForRef = this.#annotationTypesByRef.get(ref);
    if (typesForRef) {
      for (const t of typesForRef) {
        const typeMap = this.#annotationsByType.get(t);
        if (typeMap) {
          const annotations = typeMap.get(ref);
          if (annotations) {
            const first = annotations.values().next().value;
            if (first) return first;
          }
        }
      }
    }
    // Check sub-sets
    for (const subSet of this.#subSets) {
      const result = subSet.lookup(ref);
      if (result !== undefined) return result;
    }
    return undefined;
  }

  /**
   * Lookup all annotation values for a ref and type
   */
  lookupAll<T>(ref: Ref<any>, type: AnnotationType<T>): T[];

  /**
   * Lookup all annotations for a ref (across all types)
   */
  lookupAll(ref: Ref<any>): AnnotationValue<any>[];

  lookupAll<T>(
    ref: Ref<any>,
    type?: AnnotationType<T>
  ): T[] | AnnotationValue<any>[] {
    if (type) {
      return this.#lookupAllByType(ref, type);
    } else {
      return this.#lookupAllAny(ref);
    }
  }

  /**
   * Lookup all annotation values for a ref and specific type
   */
  #lookupAllByType<T>(ref: Ref<any>, type: AnnotationType<T>): T[] {
    const result: T[] = [];

    const typeMap = this.#annotationsByType.get(type);
    if (typeMap) {
      const annotations = typeMap.get(ref);
      if (annotations) {
        for (const ann of annotations) {
          result.push(ann.value);
        }
      }
    }

    // Check sub-sets
    for (const subSet of this.#subSets) {
      result.push(...subSet.lookupAll(ref, type));
    }

    return result;
  }

  /**
   * Lookup all annotations for a ref (any type)
   */
  #lookupAllAny(ref: Ref<any>): AnnotationValue<any>[] {
    const result: AnnotationValue<any>[] = [];

    const typesForRef = this.#annotationTypesByRef.get(ref);
    if (typesForRef) {
      for (const t of typesForRef) {
        const typeMap = this.#annotationsByType.get(t);
        if (typeMap) {
          const annotations = typeMap.get(ref);
          if (annotations) {
            for (const ann of annotations) {
              result.push(ann);
            }
          }
        }
      }
    }

    // Check sub-sets
    for (const subSet of this.#subSets) {
      result.push(...subSet.lookupAll(ref));
    }

    return result;
  }

  /**
   * Make the annotation set iterable
   * Iterates over own annotations and all sub-annotation sets
   */
  *[Symbol.iterator](): Iterator<[Ref<unknown>, AnnotationValue<any>]> {
    // Yield own annotations
    for (const [type, annoationsByRef] of this.#annotationsByType) {
      for (const [ref, annotations] of annoationsByRef) {
        for (const annotation of annotations) {
          yield [ref, annotation];
        }
      }
    }
    // Yield annotations from sub-sets
    for (const subSet of this.#subSets) {
      for (const entry of subSet) {
        yield entry;
      }
    }
  }
}

/**
 * Internal class for passing annotation collections (e.g., in event payloads).
 * Not exposed to users - only visible as AnnotationsCollection interface.
 */
export class ReadOnlyAnnotationSet implements AnnotationCollection {
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
