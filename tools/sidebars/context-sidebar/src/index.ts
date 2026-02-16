import { Plugin } from "@inkandswitch/patchwork-plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "context-sidebar",
    tags: ["sidebar-context"],
    name: "Context Sidebar",
    icon: "Tabs",
    supportedDatatypes: ["account"],
    async load() {
      const { renderTabbedView } = await import("./ContextSidebar");
      return renderTabbedView;
    },
  },
];
