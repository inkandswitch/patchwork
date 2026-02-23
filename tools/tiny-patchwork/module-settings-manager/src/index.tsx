export const plugins = [
  {
    id: "module-settings-manager",
    type: "patchwork:tool",
    name: "Module Settings Manager",
    icon: "Settings",
    supportedDatatypes: ["patchwork:module-settings", "my-tools"],
    importPath: "./dist/mount.js",
  },
];
