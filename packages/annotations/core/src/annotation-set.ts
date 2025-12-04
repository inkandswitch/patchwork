import { ObservableEventEmitter } from "@patchwork/observable";
import { Ref } from "@patchwork/refs";
import { Annotation, AnnotationSource, AnnotationEvents } from "./types";
import type {
  AnnotationType,
  AnnotationTypeId,
  AnnotationValue,
} from "./annotation-type";
import { AnnotationsOfType } from "./views/annotations-of-type";
import { AnnotationsOnRef } from "./views/annotations-on-ref";
import { FilteredAnnotationView } from "./views/filtered-annotation-view";

/**
 * Type guard to check if a value is an AnnotationSource
 */
function isAnnotationSource(value: unknown): value is AnnotationSource {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as AnnotationSource).entriesOfType === "function" &&
    typeof (value as AnnotationSource).entriesOnRef === "function" &&
    Symbol.iterator in value
  );
}

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
  implements AnnotationSource
{
  // stores for each annotation type a map of refs to the annotations
  #annotationsByTypeId: Map<
    AnnotationTypeId,
    Map<Ref, Set<AnnotationValue<any>>>
  > = new Map();

  // tracks for each ref which annotation types it has
  #typeIdsByRef: Map<Ref, Set<AnnotationTypeId>> = new Map();

  // Sub-annotation sets that are included in this set
  #addedSources: AnnotationSource[] = [];

  // Cleanup functions for event listeners on sub-sets
  #subSetCleanups: Map<AnnotationSource, () => void> = new Map();

  /**
   * Add an annotation set as a sub-set
   */
  add(source: AnnotationSource): void;

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
    refOrSource: Ref<any> | AnnotationSource,
    annotation?: AnnotationValue<T> | AnnotationValue<any>[]
  ): void {
    let added: [Ref, AnnotationValue<any>][];

    // Case: adding a ref
    if (refOrSource instanceof Ref) {
      // Case: Adding multiple annotations
      if (Array.isArray(annotation)) {
        added = [];
        for (const ann of annotation) {
          added.push(this.#addSingleAnnotation(refOrSource, ann));
        }
      }
      // Case: Adding a single annotation
      else if (annotation) {
        added = [this.#addSingleAnnotation(refOrSource, annotation)];
      } else {
        return;
      }
    } else {
      // Case: Adding an AnnotationSource as a sub-source
      added = this.#addSource(refOrSource);
    }

    // Emit events in one place
    if (added.length > 0) {
      this.emit("added", added);
      this.notifySubscribers();
    }
  }

  /**
   * Internal helper to add an annotation source
   * Returns the entries that were added (existing annotations in the source)
   */
  #addSource(source: AnnotationSource): [Ref, AnnotationValue<any>][] {
    this.#addedSources.push(source);

    // Forward events from source
    const onAdded = (annotations: Annotation[]) => {
      this.emit("added", annotations);
      this.notifySubscribers();
    };
    const onRemoved = (annotations: Annotation[]) => {
      this.emit("removed", annotations);
      this.notifySubscribers();
    };

    source.on("added", onAdded);
    source.on("removed", onRemoved);

    // Store cleanup function
    this.#subSetCleanups.set(source, () => {
      source.off("added", onAdded);
      source.off("removed", onRemoved);
    });

    // Collect all existing annotations in the source
    const entries: [Ref, AnnotationValue<any>][] = [];
    for (const [ref, ann] of source) {
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
   * Remove an annotation source
   */
  remove(source: AnnotationSource): void;

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
    refOrAnnotationTypeOrSource:
      | Ref<any>
      | AnnotationType<T>
      | AnnotationSource,
    annotationType?: AnnotationType<T>
  ): void {
    let removed: Annotation[];

    if (refOrAnnotationTypeOrSource instanceof Ref) {
      if (annotationType) {
        removed = this.#removeTypeFromRef(
          refOrAnnotationTypeOrSource,
          annotationType
        );
      } else {
        removed = this.#removeAllFromRef(refOrAnnotationTypeOrSource);
      }
    } else if (typeof refOrAnnotationTypeOrSource === "function") {
      removed = this.#removeType(refOrAnnotationTypeOrSource);
    } else {
      removed = this.#removeSource(refOrAnnotationTypeOrSource);
    }

    // Emit event for all removed annotations
    if (removed.length > 0) {
      this.emit("removed", removed);
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

    return removed;
  }

  /**
   * Internal helper to remove an annotation source
   * Returns the entries that were removed
   */
  #removeSource(source: AnnotationSource): [Ref, AnnotationValue<any>][] {
    const index = this.#addedSources.indexOf(source);
    if (index === -1) return [];

    // Remove from sources array
    this.#addedSources.splice(index, 1);

    // Clean up event listeners
    const cleanup = this.#subSetCleanups.get(source);
    if (cleanup) {
      cleanup();
      this.#subSetCleanups.delete(source);
    }

    // Collect all annotations that were in this source
    const entries: [Ref, AnnotationValue<any>][] = [];
    for (const [ref, ann] of source) {
      entries.push([ref, ann]);
    }
    return entries;
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
    for (const subSet of this.#addedSources) {
      yield* subSet.entriesOfType(type);
    }
  }

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
    for (const subSet of this.#addedSources) {
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
    for (const subSet of this.#addedSources) {
      for (const entry of subSet) {
        yield entry;
      }
    }
  }
}
