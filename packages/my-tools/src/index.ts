import type { LoadablePlugin } from "@patchwork/sdk";

export const plugins: LoadablePlugin<any>[] = [
  {
    type: "patchwork:dataType",
    id: "my-tools",
    name: "My Tools",
    icon: "Cog",
    unlisted: true,

    async load() {
      const { dataType } = await import("./datatype");
      return dataType;
    },
  },
  {
    type: "patchwork:tool",
    id: "my-tools",
    name: "My Tools",
    supportedDataTypes: ["my-tools"],
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
