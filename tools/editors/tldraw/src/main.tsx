export const plugins = [
  {
    type: "patchwork:datatype",
    id: "tldraw",
    name: "Drawing",
    icon: "PenLine",
    unlisted: true,
    importPath: "./dist/mount-datatype.js",
  },
  {
    type: "patchwork:tool",
    id: "tldraw",
    name: "Drawing",
    supportedDatatypes: ["tldraw"],
    importPath: "./dist/mount-tool.js",
  },
];
