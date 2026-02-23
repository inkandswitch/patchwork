import type { PluginDescription } from "@inkandswitch/patchwork-plugins";

export const plugins: PluginDescription[] = [
  {
    type: "patchwork:tool",
    id: "back-link-button",
    tags: ["titlebar-tool"],
    name: "Back Link Button",
    icon: "ArrowLeft",
    supportedDatatypes: "*",
    importPath: "./dist/mount.js",
    unlisted: true,
    forTitleBar: true,
  } as any,
];
