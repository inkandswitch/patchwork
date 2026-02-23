export const plugins = [
  {
    id: "chee/sideboard",
    type: "patchwork:tool",
    tags: ["sidebar-account"],
    name: "Sideboard",
    supportedDatatypes: ["patchwork:account", "folder"],
    icon: "FolderOpen",
    importPath: "./dist/mount.js",
  },
];
