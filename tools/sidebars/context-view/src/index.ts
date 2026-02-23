import type { PluginDescription } from "@inkandswitch/patchwork-plugins";

export const plugins: PluginDescription[] = [
  {
    type: "patchwork:tool",
    id: "context-view",
    tags: ["context-tool"],
    name: "Context",
    icon: "TextSearch",
    supportedDatatypes: ["context-view"],
    importPath: "./dist/mount.js",
  } as any,
];
