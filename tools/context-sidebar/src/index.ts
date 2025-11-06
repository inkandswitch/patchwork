import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "context-sidebar",
    name: "Context Sidebar",
    icon: "Tabs",
    supportedDataTypes: ["account"],
    async load() {
      const { renderTabbedView } = await import("./ContextSidebar");
      return renderTabbedView;
    },
  },
];
