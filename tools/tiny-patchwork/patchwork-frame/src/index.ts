import type { PluginDescription } from "@inkandswitch/patchwork-plugins";

export const plugins: PluginDescription[] = [
  {
    type: "patchwork:tool",
    id: "patchwork-frame",
    category: "frame",
    name: "Patchwork Frame",
    icon: "Window",
    supportedDatatypes: ["account"],
    importPath: "./dist/mount.js",
  } as any,
];
