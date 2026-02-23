export const plugins = [
  {
    type: "patchwork:tool",
    id: "sync-indicator",
    tags: ["titlebar-tool"],
    name: "Sync Indicator",
    icon: "Wifi",
    supportedDatatypes: "*" as const,
    unlisted: true,
    forTitleBar: true,
    importPath: "./dist/mount.js",
  },
];
