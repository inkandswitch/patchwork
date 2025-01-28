import {
  DataTypeDescription,
  ToolDescription,
  ImportMethod,
  ExportMethod,
} from "@patchwork/sdk";
import { TextAnchor } from "@patchwork/sdk/textAnchors";
import type { MarkdownDoc } from "./datatype";
import { markdownImport } from "./importMethods";
import { markdownExport } from "./exportMethods";

export { isMarkdownDoc } from "./utils";
export type { MarkdownDoc };
export { getTitle } from "./datatype";

export const dataType: DataTypeDescription<MarkdownDoc, TextAnchor, string> = {
  id: "essay",
  type: "patchwork:dataType",
  name: "Essay",
  icon: "FileText",
  async load() {
    const { dataType } = await import("./datatype");
    const importMethods = await import("./importMethods");
    const exportMethods = await import("./exportMethods");
    return {
      ...dataType,
      ...importMethods,
      ...exportMethods,
    };
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

export const importMethods: ImportMethod[] = [markdownImport];
export const exportMethods: ExportMethod[] = [markdownExport];
