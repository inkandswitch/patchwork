import type { TextAnchor } from "@patchwork/sdk/textAnchors";
import type { DataTypeDescription, ToolDescription } from "@patchwork/sdk";
import type { ImportMethod } from "@patchwork/sdk";
import type { ExportMethod } from "@patchwork/sdk";
import type { FileDoc } from "./datatype";
import { universalImport } from "./importMethods";
import { universalExport } from "./exportMethods";

// For others to enjoy
export type { FileDoc };
export { isBinaryFileDoc, isTextFileDoc } from "./datatype";
export { isBinaryCheck } from "./isBinaryFile";
export { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from "./utils";

export const dataType: DataTypeDescription<FileDoc, TextAnchor, string> = {
  type: "patchwork:dataType",
  id: "file",
  name: "File",
  icon: "File",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
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
];

export const importMethods: ImportMethod[] = [universalImport];
export const exportMethods: ExportMethod[] = [universalExport];
