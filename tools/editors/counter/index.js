/**
 * Plugin definitions for the Counter tool
 */
export const plugins = [
  {
    type: "patchwork:datatype",
    id: "counter",
    name: "Counter",
    icon: "Hash",
    async load() {
      const { CounterDataType } = await import("./implementation.js");
      return CounterDataType;
    },
  },
  {
    type: "patchwork:tool",
    id: "counter",
    name: "Counter",
    icon: "Hash",
    supportedDataTypes: ["counter"],
    async load() {
      const { renderCounter } = await import("./implementation.js");
      return renderCounter;
    },
  },
];
