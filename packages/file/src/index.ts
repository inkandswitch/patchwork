import type { TextAnchor } from "@patchwork/sdk/textAnchors";
import type { FileDoc, FileContent } from "./datatype";
import type { DataTypeDescription, ToolDescription } from "@patchwork/sdk";

// For others to enjoy
export { type FileDoc, type FileContent };
export { isBinaryCheck } from "./isBinaryFile";

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
