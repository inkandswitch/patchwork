import type { TextAnchor } from "@patchwork/sdk/textAnchors";
import type { DataTypeDescription, ToolDescription } from "@patchwork/sdk";
import type { MarkdownDoc } from "./datatype";

export { isMarkdownDoc } from "./utils";

export const dataType: DataTypeDescription<MarkdownDoc, TextAnchor, string> = {
  type: "patchwork:dataType",
  id: "essay",
  name: "Essay",
  icon: "Text",
  unixFileExtensions: ["md"],
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "essay",
    name: "Editor",
    supportedDataTypes: ["essay"],

    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
