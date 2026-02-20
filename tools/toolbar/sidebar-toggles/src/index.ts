import { Plugin } from "@inkandswitch/patchwork-plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "account-sidebar-toggle",
    tags: ["titlebar-tool"],
    name: "Account Sidebar Toggle",
    icon: "PanelLeft",
    supportedDatatypes: "*",
    async load() {
      const { createSidebarToggle } = await import("./SidebarToggle.js");
      return createSidebarToggle("left");
    },
    unlisted: true,
    forTitleBar: true,
  },
  {
    type: "patchwork:tool",
    id: "context-sidebar-toggle",
    tags: ["titlebar-tool"],
    name: "Context Sidebar Toggle",
    icon: "PanelRight",
    supportedDatatypes: "*",
    async load() {
      const { createSidebarToggle } = await import("./SidebarToggle.js");
      return createSidebarToggle("right");
    },
    unlisted: true,
    forTitleBar: true,
  },
];
