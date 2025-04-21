import type { Plugin } from "@patchwork/sdk";
import type { FileDoc } from "./types";
import { universalImport } from "./importMethods";
import { universalExport } from "./exportMethods";

// For others to enjoy
export type { FileDoc };
export { isBinaryFileDoc, isTextFileDoc } from "./datatype";
export { isBinaryCheck } from "./isBinaryFile";
export { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from "./utils";

export const plugins: Plugin[] = [
  {
    type: "patchwork:dataType",
    id: "file",
    name: "File",
    icon: "File",
    async load() {
      const { dataType } = await import("./datatype");
      return dataType;
    },
  },
  {
    type: "patchwork:tool",
    id: "file",
    name: "File",
    supportedDataTypes: ["file"],
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
  universalImport,
  universalExport,
];
