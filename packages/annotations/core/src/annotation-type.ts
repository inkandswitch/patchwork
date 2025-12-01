import { type Ref } from "@patchwork/refs";
import type { AnnotationSet } from "./annotation-set";

/**
 * Represents an annotation type with its unique identifier
 */
export type AnnotationType<T> = {
  (value: T): AnnotationValue<T>;
  from(annotationSet: AnnotationSet): (ref: Ref<unknown>) => T | undefined;
};

/**
 * An annotation value with its type information
 */
export type AnnotationValue<T> = {
  type: AnnotationType<T>;
  value: T;
};

/**
 * Defines a new annotation type
 */
export function defineAnnotationType<T>(): AnnotationType<T> {
  const annotationType = ((value: T): AnnotationValue<T> => {
    return {
      type: annotationType,
      value,
    };
  }) as AnnotationType<T>;

  annotationType.from = (annotationSet: AnnotationSet) => {
    return (ref: Ref<unknown>): T | undefined => {
      return annotationSet.get(annotationType, ref);
    };
  };

  return annotationType;
}

