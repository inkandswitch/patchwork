import * as PACKAGES from "./packages";
import { isTool } from "./tools";

const builtInToolsUnsorted = Object.values(PACKAGES).flatMap((module) =>
  Object.values(module).filter(isTool)
);

// HACK: The raw editor gets special treatment as the last tool in the list;
// this prevents it from ever being used as the default tool for a document.
// We should improve this with some kind of tool prioritization system
export const builtInTools = [
  ...builtInToolsUnsorted.filter((tool) => tool.id !== "raw"),
  builtInToolsUnsorted.find((tool) => tool.id === "raw"),
];
