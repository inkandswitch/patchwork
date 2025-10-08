export type FieldValue<Type extends symbol, Value> = {
  type: Type;
  name: string;
  value: Value;
};

export type FieldType<Type extends symbol, Value> = {
  (value: Value): FieldValue<Type, Value>;
  fieldName: string;
  type: Type;
};

export const defineField = <Type extends symbol, Value>(
  fieldName: string,
  type: Type
): FieldType<Type, Value> => {
  return Object.assign(
    (value: Value): FieldValue<Type, Value> => {
      return { value, type, name: fieldName };
    },
    { fieldName, type }
  ) as FieldType<Type, Value>;
};
