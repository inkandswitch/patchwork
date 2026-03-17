export const plugins = [
  {
    type: "patchwork:datatype",
    id: "xterm",
    name: "Terminal",
    icon: "Terminal",
    importPath: "./xterm-datatype.js",
  },
  {
    type: "patchwork:tool",
    id: "xterm",
    name: "Terminal",
    icon: "Terminal",
    supportedDatatypes: ["xterm"],
    importPath: "./xterm-tool.js",
  },
];
