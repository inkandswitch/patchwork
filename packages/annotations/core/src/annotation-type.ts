/**
 * Represents an annotation type - a function that creates annotation values
 */
export type AnnotationType<T = unknown> = (value: T) => AnnotationValue<T>;

/**
 * An annotation value with its type information
 */
export type AnnotationValue<T = unknown> = {
  type: AnnotationType<T>;
  value: T;
};

/**
 * Defines a new annotation type
 */
export const defineAnnotationType = <T>(): AnnotationType<T> => {
  const annotationType: AnnotationType<T> = (value: T): AnnotationValue<T> => {
    return {
      type: annotationType,
      value,
    };
  };

  return annotationType;
};
