export const plugins = [
  {
    type: "patchwork:tool",
    id: "orion/markwhen",
    name: "Markwhen",
    supportedDatatypes: ["markdown"],
    importPath: "./dist/mount.js",
  },
];
