import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "simple-sidebar",
    name: "Simple Sidebar",
    icon: "Sidebar",
    supportedDataTypes: ["folder"],
    async load() {
      const { renderSidebar } = await import("./Sidebar");
      return { render: renderSidebar };
    },
  },
];
