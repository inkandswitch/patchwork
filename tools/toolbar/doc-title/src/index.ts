import type { PluginDescription } from "@inkandswitch/patchwork-plugins";

export const plugins: PluginDescription[] = [
  {
    type: "patchwork:tool",
    id: "document-title",
    tags: ["titlebar-tool"],
    name: "Document Title",
    icon: "Heading",
    supportedDatatypes: "*",
    importPath: "./dist/mount.js",
    unlisted: true,
    forTitleBar: true,
  } as any,
];
