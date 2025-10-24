import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "tabbed-view",
    name: "Tabbed View",
    icon: "Tabs",
    supportedDataTypes: ["tabbed-view"],
    async load() {
      const { renderTabbedView } = await import("./TabbedView");
      return renderTabbedView;
    },
  },
  {
    type: "patchwork:datatype",
    id: "tabbed-view",
    name: "Tabbed View",
    icon: "Tabs",
    unlisted: true,
    async load() {
      const { TabbedViewDataType } = await import("./datatype");
      return TabbedViewDataType;
    },
  },
];
