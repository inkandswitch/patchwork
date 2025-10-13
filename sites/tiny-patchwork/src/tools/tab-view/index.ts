import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "tab-view",
    name: "Tab View",
    icon: "Tabs",
    supportedDataTypes: ["tab-view"],
    async load() {
      const { renderTabViewer } = await import("./TabViewer");
      return { render: renderTabViewer };
    },
  },
  {
    type: "patchwork:datatype",
    id: "tab-view",
    name: "Tab View",
    icon: "Tabs",
    unlisted: true,
    async load() {
      const { TabViewDataType } = await import("./datatype");
      return TabViewDataType;
    },
  },
];
