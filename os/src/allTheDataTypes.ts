import { DataType } from "./datatypes";
import * as DATATYPES from "./packages/datatypes";

const isDataType = (
  value: any
): value is DataType<unknown, unknown, unknown> => {
  return "type" in value && value.type === "patchwork:dataType";
};

export const allTheDataTypes = Object.values(DATATYPES).flatMap((module) =>
  Object.values(module).filter(isDataType)
);

export const dataTypeById = <D, T, V>(id: string | undefined) => {
  return allTheDataTypes.find((dataType) => dataType.id == id) as
    | DataType<D, T, V>
    | undefined;
};
