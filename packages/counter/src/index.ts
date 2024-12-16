import type { DeferredDataType, DeferredTool } from "@patchwork/sdk";
import type { CounterDoc } from "./datatype";

export const dataType: DeferredDataType<CounterDoc> = {
  type: "patchwork:dataType",
  id: "counter",
  name: "Counter",
  icon: "PlusCircle",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: DeferredTool[] = [
  {
    id: "counter",
    type: "patchwork:tool",
    supportedDataTypes: ["counter"],
    name: "Counter",
    icon: "PlusCircle",
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
