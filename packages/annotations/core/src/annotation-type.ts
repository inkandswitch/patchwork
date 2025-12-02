/**
 * Represents an annotation type with its unique identifier
 */
export type AnnotationType<T = unknown> = {
  name: string;
  (value: T): AnnotationValue<T>;
};

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
export const defineAnnotationType = <T>(name: string) => {
  const annotationType = (value: T): AnnotationValue<T> => {
    return {
      type: annotationType,
      value,
    };
  };

  annotationType.name = name;
  return annotationType;
};
