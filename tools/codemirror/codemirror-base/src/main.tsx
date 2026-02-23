export const plugins = [
  {
    type: "patchwork:tool",
    id: "codemirror-base",
    name: "Text Editor",
    supportedDatatypes: ["essay", "markdown"],
    importPath: "./dist/mount.js",
  },
];
