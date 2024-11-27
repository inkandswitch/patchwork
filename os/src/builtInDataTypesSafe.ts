import { isDataType } from "@patchwork/sdk";
import * as DATATYPES_SAFE from "./packages/datatypesSafe";

export const builtInDataTypesSafe = Object.values({
  ...DATATYPES_SAFE,
}).flatMap((module) => Object.values(module).filter(isDataType));
