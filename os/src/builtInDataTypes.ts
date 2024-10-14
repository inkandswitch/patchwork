import { isDataType } from "./datatypes";
import * as DATATYPES_SAFE from "./packages/datatypesSafe";
import * as DATATYPES_UNSAFE from "./packages/datatypesUnsafe";

export const builtInDataTypes = Object.values({
  ...DATATYPES_SAFE,
  ...DATATYPES_UNSAFE,
}).flatMap((module) => Object.values(module).filter(isDataType));
