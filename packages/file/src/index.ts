import type { TextAnchor } from "@patchwork/sdk/textAnchors";
import type { FileDoc, FileContent } from "./datatype";
import type { DeferredDataType, DeferredTool } from "@patchwork/sdk";

// For others to enjoy
export { type FileDoc, type FileContent };

export const dataType: DeferredDataType<FileDoc, TextAnchor, string> = {
  type: "patchwork:dataType",
  id: "file",
  name: "File",
  icon: "PlusCircle",
  unixFileExtensions: ["*"],
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: DeferredTool[] = [
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
