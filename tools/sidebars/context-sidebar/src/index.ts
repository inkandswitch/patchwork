import type { PluginDescription } from "@inkandswitch/patchwork-plugins";

export const plugins: PluginDescription[] = [
  {
    type: "patchwork:tool",
    id: "context-sidebar",
    tags: ["sidebar-context"],
    name: "Context Sidebar",
    icon: "Tabs",
    supportedDatatypes: ["account"],
    importPath: "./dist/mount.js",
  } as any,
];
