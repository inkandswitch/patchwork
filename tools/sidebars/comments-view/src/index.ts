import type { PluginDescription } from "@inkandswitch/patchwork-plugins";

export const plugins: PluginDescription[] = [
  {
    type: "patchwork:tool",
    id: "comments-view",
    tags: ["context-tool"],
    name: "Comments",
    icon: "Comments",
    supportedDatatypes: ["account"],
    importPath: "./dist/mount.js",
  } as any,
];
