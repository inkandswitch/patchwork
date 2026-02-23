import type { PluginDescription } from "@inkandswitch/patchwork-plugins";

export const plugins: PluginDescription[] = [
  {
    type: "patchwork:tool",
    id: "tool-picker",
    tags: ["titlebar-tool"],
    name: "Tool Picker",
    icon: "Wrench",
    supportedDatatypes: "*",
    importPath: "./dist/mount.js",
    unlisted: true,
    forTitleBar: true,
  } as any,
];
