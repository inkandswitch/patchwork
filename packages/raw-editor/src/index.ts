import { ToolDescription } from "@patchwork/sdk";

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "raw",
    name: "Raw",
    supportedDataTypes: "*",
    async load() {
      return (await import("./tool")).tool;
    },
  },
];
