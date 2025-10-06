import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "patchwork-frame",
    name: "Counter",
    icon: "CirclePlus",
    supportedDataTypes: ["account"],
    async load() {
      const { renderFrame } = await import("./Frame");
      return { render: renderFrame };
    },
  },
];
