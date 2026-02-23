import type { PluginDescription } from "@inkandswitch/patchwork-plugins";

export const plugins: PluginDescription[] = [
  {
    type: "patchwork:tool",
    tags: ["titlebar-tool"],
    id: "spacer",
    name: "Spacer",
    icon: "Spacer",
    supportedDatatypes: "*",
    importPath: "./dist/mount.js",
    unlisted: true,
    forTitleBar: true,
  } as any,
];
