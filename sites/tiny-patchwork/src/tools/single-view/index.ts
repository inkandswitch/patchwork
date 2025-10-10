import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "single-view",
    name: "Single View",
    icon: "Eye",
    supportedDataTypes: ["single-view"],
    async load() {
      const { renderSingleView } = await import("./SingleView");
      return { render: renderSingleView };
    },
  },
  {
    type: "patchwork:datatype",
    id: "single-view",
    name: "Single View",
    icon: "Eye",
    unlisted: true,
    async load() {
      const { SingleViewDataType } = await import("./datatype");
      return SingleViewDataType;
    },
  },
];
