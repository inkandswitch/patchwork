import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "single-view",
    name: "Single View",
    icon: "Eye",
    supportedDataTypes: ["patchwork/main-view"],
    async load() {
      const { renderSingleView } = await import("./SimpleMainView");
      return renderSingleView;
    },
  },
];
