import { isDataType } from "./datatypes";
import * as DATATYPES from "./packages/datatypes";

export const builtInDataTypes = Object.values(DATATYPES).flatMap((module) =>
  Object.values(module).filter(isDataType)
);
