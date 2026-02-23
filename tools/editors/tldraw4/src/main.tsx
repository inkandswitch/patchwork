export const plugins = [
  {
    type: "patchwork:datatype",
    id: "tldraw4",
    name: "tldraw",
    icon: "PenLine",
    importPath: "./dist/mount-datatype.js",
  },
  {
    type: "patchwork:tool",
    id: "tldraw4",
    name: "tldraw",
    supportedDatatypes: ["tldraw4"],
    importPath: "./dist/mount-tool.js",
  },
];
