import { SubscriberSet } from "@inkandswitch/observable";
import { type Ref } from "@patchwork/refs";
import EventEmitter from "eventemitter3";
import {
  Annotation,
  AnnotationSource,
  AnnotationEvents,
  AnnotationChange,
} from "./types";
import type {
  AnnotationType,
  AnnotationTypeId,
  AnnotationValue,
} from "./annotation-type";
import { AnnotationsOfType } from "./views/annotations-of-type";
import { AnnotationsOnRef } from "./views/annotations-on-ref";
import { FilteredAnnotationView } from "./views/filtered-annotation-view";

type Observable<T> = {
  subscribe: (callback: (value: T) => void) => () => void;
  value: T;
};

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
  extends EventEmitter<AnnotationEvents>
  implements Observable<AnnotationSet>
{
  #subscriberSet = new SubscriberSet<AnnotationSet>();

  get value(): AnnotationSet {
    return this;
  }

  subscribe(callback: (value: AnnotationSet) => void): () => void {
    return this.#subscriberSet.add(callback);
  }
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
  subSourceCleanups: Map<AnnotationSource, () => void> = new Map();

  // Current active transaction
  currentAnnotationChanges?: AnnotationChange;

  /**
   * Batch changes to the annotation set.
   * Events are emitted only after the callback completes.
   */
  change(callback: () => void): void {
    if (this.currentAnnotationChanges) {
      throw new Error("Nested changes are not allowed");
    }

    this.currentAnnotationChanges = { added: [], removed: [] };

    try {
      callback();
    } finally {
      const change = this.currentAnnotationChanges;
      this.currentAnnotationChanges = undefined;

      if (change && (change.added.length > 0 || change.removed.length > 0)) {
        this.emit("change", change);
        this.#subscriberSet.notify(this);
      }
    }
  }

  /**
   * Internal helper to dispatch changes
   */
  #dispatchChange(change: AnnotationChange) {
    if (this.currentAnnotationChanges) {
      this.currentAnnotationChanges.added.push(...change.added);
      this.currentAnnotationChanges.removed.push(...change.removed);
    } else {
      if (change.added.length > 0 || change.removed.length > 0) {
        this.emit("change", change);
        this.#subscriberSet.notify(this);
      }
    }
  }

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
    if ("url" in refOrSource) {
      // Case: Adding multiple annotations
      if (Array.isArray(annotation)) {
        added = [];
        for (const a of annotation) {
          added.push(this.#addSingleAnnotation(refOrSource, a));
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
      this.#dispatchChange({ added, removed: [] });
    }
  }

  /**
   * Lookup the first annotation value for a ref and type
   */
  lookup<T>(ref: Ref<any>, type: AnnotationType<T>): T | undefined {
    return this.onRef(ref).lookup(type);
  }

  /**
   * Lookup all annotation values for a ref and type
   */
  lookupAll<T>(ref: Ref<any>, type: AnnotationType<T>): T[] {
    return this.onRef(ref).lookupAll(type);
  }

  /**
   * Internal helper to add an annotation source
   * Returns the entries that were added (existing annotations in the source)
   */
  #addSource(source: AnnotationSource): [Ref, AnnotationValue<any>][] {
    this.#addedSources.push(source);

    // Forward events from source
    const onChange = (change: AnnotationChange) => {
      this.#dispatchChange(change);
    };

    source.on("change", onChange);

    // Store cleanup function
    this.subSourceCleanups.set(source, () => {
      source.off("change", onChange);
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

    if ("url" in refOrAnnotationTypeOrSource) {
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
      this.#dispatchChange({ added: [], removed });
    }
  }

  /**
   * Remove all annotations and sub-sources from this set.
   * This removes all locally stored annotations and removes all added sub-sources.
   */
  clear(): void {
    const annotationChanges: AnnotationChange = this
      .currentAnnotationChanges ?? { added: [], removed: [] };
    const { removed } = annotationChanges;

    // Collect local annotations
    for (const [, typeMap] of this.#annotationsByTypeId) {
      for (const [ref, annotations] of typeMap) {
        for (const annotation of annotations) {
          removed.push([ref, annotation]);
        }
      }
    }

    // Collect subset annotations and cleanup
    for (const source of this.#addedSources) {
      for (const [ref, ann] of source) {
        removed.push([ref, ann]);
      }

      const cleanup = this.subSourceCleanups.get(source);
      if (cleanup) {
        cleanup();
      }
    }

    // Clear state
    this.#annotationsByTypeId.clear();
    this.#typeIdsByRef.clear();
    this.#addedSources = [];
    this.subSourceCleanups.clear();

    // Emit events
    if (removed.length > 0 && !this.currentAnnotationChanges) {
      this.emit("change", annotationChanges);
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
    const cleanup = this.subSourceCleanups.get(source);
    if (cleanup) {
      cleanup();
      this.subSourceCleanups.delete(source);
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
   * Iterator for all unique refs that have annotations
   */
  get refs(): Iterable<Ref<unknown>> {
    const self = this;
    return {
      *[Symbol.iterator]() {
        const seenRefs = new Set<Ref<unknown>>();

        // Yield refs from local storage
        for (const ref of self.#typeIdsByRef.keys()) {
          if (!seenRefs.has(ref)) {
            seenRefs.add(ref);
            yield ref;
          }
        }

        // Yield refs from sub-sources
        for (const subSource of self.#addedSources) {
          for (const ref of subSource.refs) {
            if (!seenRefs.has(ref)) {
              seenRefs.add(ref);
              yield ref;
            }
          }
        }
      },
    };
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
