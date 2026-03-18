export const plugins = [
  {
    type: "patchwork:datatype",
    id: "xterm",
    name: "Terminal",
    icon: "Terminal",
    async load() { return import("./xterm-datatype.js").then(mod => mod.default) }
  },
  {
    type: "patchwork:tool",
    id: "xterm",
    name: "Terminal",
    icon: "Terminal",
    supportedDatatypes: ["xterm"],
    async load() { return import("./xterm-tool.js").then(mod => mod.default) }
  },
];
