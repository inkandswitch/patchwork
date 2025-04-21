import type { Plugin } from "@patchwork/sdk";

export const plugins: Plugin[] = [
  {
    type: "patchwork:dataType",
    id: "tldraw",
    name: "Drawing",
    icon: "PenLine",
    async load() {
      const { dataType } = await import("./datatype");
      return dataType;
    },
  },
  {
    type: "patchwork:tool",
    id: "tldraw",
    name: "Drawing",
    supportedDataTypes: ["tldraw"],
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
