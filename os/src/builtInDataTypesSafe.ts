import { isDataType } from "./datatypes";
import * as DATATYPES_SAFE from "./packages/datatypesSafe";

export const builtInDataTypesSafe = Object.values({
  ...DATATYPES_SAFE,
}).flatMap((module) => Object.values(module).filter(isDataType));
