import { LoadablePlugin } from "@patchwork/sdk";
import type { MarkdownDoc } from "./datatype";
import { markdownImport } from "./importMethods";
import { markdownExport } from "./exportMethods";
import { essayAIPrompt } from "./aiPrompt";

export { isMarkdownDoc } from "./utils";
export type { MarkdownDoc };
export { getTitle } from "./datatype";

export const plugins: LoadablePlugin<any>[] = [
  {
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
  },
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
  markdownImport,
  markdownExport,
  essayAIPrompt,
];
