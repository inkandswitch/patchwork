export const plugins = [
  {
    type: "codemirror:extension",
    id: "codemirror-embed",
    name: "Patchwork Embed",
    supportedDatatypes: ["markdown"],
    importPath: "./dist/mount.js",
  },
];
