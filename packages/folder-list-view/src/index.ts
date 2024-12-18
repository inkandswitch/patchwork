import { ToolDescription } from "@patchwork/sdk";

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "folder-view-list",
    name: "List",
    supportedDataTypes: ["folder"],

    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
