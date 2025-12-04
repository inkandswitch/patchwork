import { ObservableEventEmitter } from "@patchwork/observable";
import { type Ref } from "@patchwork/refs";

import type { AnnotationType, AnnotationValue } from "./annotation-type";

export type AnnotationCollection<
  RefType = unknown,
  AnnotationValueType = unknown,
> = {
  [Symbol.iterator](): Iterator<
    [Ref<RefType>, AnnotationValue<AnnotationValueType>]
  >;
};

/* Event types emitted by AnnotationSets and AnnotationViews */
export type AnnotationEvents = {
  added: (annotations: AnnotationCollection) => void;
  removed: (annotations: AnnotationCollection) => void;
};

/**
 * Common interface for sources that can be filtered
 */
export type AnnotationSource = AnnotationCollection &
  ObservableEventEmitter<AnnotationEvents> & {
    /** @hidden */
    lookup<T>(ref: Ref<any>, type: AnnotationType<T>): T | undefined;
    /** @hidden */
    lookupAll<T>(ref: Ref<any>, type: AnnotationType<T>): T[];
    /** @hidden */
    entriesOfType<T>(
      type: AnnotationType<T>
    ): Iterable<[Ref<any>, AnnotationValue<T>]>;
    /** @hidden */
    entriesOnRef(ref: Ref<any>): Iterable<[Ref<any>, AnnotationValue<any>]>;
  };
