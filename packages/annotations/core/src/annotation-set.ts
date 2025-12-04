import { ObservableEventEmitter } from "@patchwork/observable";
import { Ref } from "@patchwork/refs";
import { AnnotationCollection, AnnotationEvents } from "./types";
import type {
  AnnotationType,
  AnnotationTypeId,
  AnnotationValue,
} from "./annotation-type";
import { AnnotationsOfType } from "./views/annotations-of-type";
import { AnnotationsOnRef } from "./views/annotations-on-ref";
import { FilteredAnnotationView } from "./views/filtered-annotation-view";

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
  // stores for each annotation type a map of refs to the annotations
  #annotationsByTypeId: Map<
    AnnotationTypeId,
    Map<Ref, Set<AnnotationValue<any>>>
  > = new Map();

  // tracks for each ref which annotation types it has
  #typeIdsByRef: Map<Ref, Set<AnnotationTypeId>> = new Map();

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
    const typeId = annotation.type.id;

    // Add to annotationsByTypeId
    let typeMap = this.#annotationsByTypeId.get(typeId);
    if (!typeMap) {
      typeMap = new Map();
      this.#annotationsByTypeId.set(typeId, typeMap);
    }

    let valueSet = typeMap.get(ref);
    if (!valueSet) {
      valueSet = new Set();
      typeMap.set(ref, valueSet);
    }

    valueSet.add(annotation);

    // add that this ref has annotation type
    let typeIdsForRef = this.#typeIdsByRef.get(ref);
    if (!typeIdsForRef) {
      typeIdsForRef = new Set();
      this.#typeIdsByRef.set(ref, typeIdsForRef);
    }
    typeIdsForRef.add(typeId);

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
    const typeIds = this.#typeIdsByRef.get(ref);
    const removed: Array<[Ref, AnnotationValue<any>]> = [];

    if (typeIds) {
      for (const typeId of typeIds) {
        const annotations = this.#annotationsByTypeId.get(typeId);
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

    this.#typeIdsByRef.delete(ref);

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
    const typeId = type.id;

    const annotations = this.#annotationsByTypeId.get(typeId);
    if (annotations) {
      const annotationsForRef = annotations.get(ref);
      if (annotationsForRef) {
        for (const annotation of annotationsForRef) {
          removed.push([ref, annotation]);
        }
      }

      annotations.delete(ref);
      this.#typeIdsByRef.get(ref)?.delete(typeId);
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
    const typeId = type.id;

    const annotationsByRef = this.#annotationsByTypeId.get(typeId);
    if (annotationsByRef) {
      for (const [ref, annotations] of annotationsByRef) {
        for (const annotation of annotations) {
          removed.push([ref, annotation]);
        }
        this.#typeIdsByRef.get(ref)?.delete(typeId);
      }

      this.#annotationsByTypeId.delete(typeId);
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
   * Filter annotations on direct children of a ref (if ref is an array or text)
   * Returns a filtered view using lazy iteration
   */
  onChildrenOf(ref: Ref<string | Array<unknown>>): FilteredAnnotationView {
    return new FilteredAnnotationView(this, (otherRef, _) =>
      otherRef.isChildOf(ref)
    );
  }

  /**
   * Filter annotations anywhere on the subtree that ref points to
   * Returns a filtered view using lazy iteration
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
    const typeMap = this.#annotationsByTypeId.get(type.id);
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
   * @hidden
   * Lookup all annotation values for a ref and type
   */
  lookupAll<T>(ref: Ref<any>, type: AnnotationType<T>): T[] {
    const result: T[] = [];

    const typeMap = this.#annotationsByTypeId.get(type.id);
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
   * @hidden
   * Iterator for all annotations of a specific type
   */
  *entriesOfType<T>(
    type: AnnotationType<T>
  ): Iterable<[Ref<any>, AnnotationValue<T>]> {
    const typeMap = this.#annotationsByTypeId.get(type.id);
    if (typeMap) {
      for (const [ref, annotations] of typeMap) {
        for (const annotation of annotations) {
          yield [ref, annotation];
        }
      }
    }
    // Check sub-sets
    for (const subSet of this.#subSets) {
      yield* subSet.entriesOfType(type);
    }
  }

  /**
   * @hidden
   * Iterator for all annotations on a specific ref
   */
  *entriesOnRef(ref: Ref<any>): Iterable<[Ref<any>, AnnotationValue<any>]> {
    const typeIdsForRef = this.#typeIdsByRef.get(ref);
    if (typeIdsForRef) {
      for (const typeId of typeIdsForRef) {
        const typeMap = this.#annotationsByTypeId.get(typeId);
        if (typeMap) {
          const annotations = typeMap.get(ref);
          if (annotations) {
            for (const annotation of annotations) {
              yield [ref, annotation];
            }
          }
        }
      }
    }
    // Check sub-sets
    for (const subSet of this.#subSets) {
      yield* subSet.entriesOnRef(ref);
    }
  }

  /**
   * Make the annotation set iterable
   * Iterates over own annotations and all sub-annotation sets
   */
  *[Symbol.iterator](): Iterator<[Ref<unknown>, AnnotationValue<any>]> {
    // Yield own annotations
    for (const [, annotationsByRef] of this.#annotationsByTypeId) {
      for (const [ref, annotations] of annotationsByRef) {
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
