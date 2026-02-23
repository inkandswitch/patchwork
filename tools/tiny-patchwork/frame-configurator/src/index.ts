import type { PluginDescription } from "@inkandswitch/patchwork-plugins";

export const plugins: PluginDescription[] = [
  {
    type: "patchwork:tool",
    id: "frame-configurator",
    name: "Frame Configurator",
    icon: "Settings",
    supportedDatatypes: ["account"],
    importPath: "./dist/mount.js",
  } as any,
];
