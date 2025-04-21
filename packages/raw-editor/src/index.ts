import type { Plugin } from "@patchwork/sdk";

export const plugins: Plugin[] = [
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
