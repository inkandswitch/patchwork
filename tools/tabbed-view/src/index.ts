import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:datatype",
    id: "tabbed-view",
    name: "Tabbed View",
    icon: "Tabs",
    async load() {
      const { TabbedViewDataType } = await import("./datatype");
      return TabbedViewDataType;
    },
  },
];


