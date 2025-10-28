export type AnnotationType<V> = {
  (value: V): AnnotationValue<V>;
  key: string;
};

export const defineAnnotation = <V = unknown>(
  key: string
): AnnotationType<V> => {
  return Object.assign(
    (value: V) => ({
      key,
      value,
    }),
    { key }
  );
};

export type AnnotationValue<V> = {
  key: string;
  value: V;
};
