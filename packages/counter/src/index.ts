import type { DataTypeDescription, ToolDescription } from "@patchwork/sdk";
import type { CounterDoc } from "./datatype";

export const dataType: DataTypeDescription<CounterDoc> = {
  type: "patchwork:dataType",
  id: "counter",
  name: "Counter DT2",
  icon: "PlusCircle",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    id: "counter",
    type: "patchwork:tool",
    supportedDataTypes: ["counter"],
    name: "Fast Counter",
    icon: "PlusCircle",
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
