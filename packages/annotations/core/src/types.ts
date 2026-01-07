import EventEmitter from "eventemitter3";
import { type Ref } from "@patchwork/refs";

import type { AnnotationType, AnnotationValue } from "./annotation-type";

export type AnnotationSource<
  RefType = unknown,
  AnnotationValueType = unknown,
> = EventEmitter<AnnotationEvents> & {
  [Symbol.iterator](): Iterator<
    [Ref<RefType>, AnnotationValue<AnnotationValueType>]
  >;

  entriesOfType<T>(
    type: AnnotationType<T>
  ): Iterable<[Ref<RefType>, AnnotationValue<T>]>;

  entriesOnRef(
    ref: Ref<RefType>
  ): Iterable<[Ref<RefType>, AnnotationValue<AnnotationValueType>]>;

  refs: Iterable<Ref<RefType>>;
};

export type Annotation<RefType = unknown, AnnotationValueType = unknown> = [
  Ref<RefType>,
  AnnotationValue<AnnotationValueType>,
];

export type AnnotationChange = {
  added: Annotation[];
  removed: Annotation[];
};

/* Event types emitted by AnnotationSets and AnnotationViews */
export type AnnotationEvents = {
  change: (change: AnnotationChange) => void;
};

/**
 * Predicate function for filtering annotations
 */
export type AnnotationFilter<
  RefType = unknown,
  AnnotationValueType = unknown,
> = (
  ref: Ref<RefType>,
  annotation: AnnotationValue<AnnotationValueType>
) => boolean;
