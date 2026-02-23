import type { PluginDescription } from "@inkandswitch/patchwork-plugins";

export const plugins: PluginDescription[] = [
  {
    type: "patchwork:tool",
    id: "add-doc-to-sidebar-button",
    tags: ["titlebar-tool"],
    name: "Add doc to sidebar button",
    icon: "Plus",
    supportedDatatypes: "*",
    importPath: "./dist/mount.js",
    unlisted: true,
    forTitleBar: true,
  } as any,
];
