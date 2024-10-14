import * as PACKAGES from "./packages";
import { isTool } from "./tools";

export const builtInTools = Object.values(PACKAGES).flatMap((module) =>
  Object.values(module).filter(isTool)
);
