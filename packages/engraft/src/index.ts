import type { DataTypeDescription, DeferredTool } from "@patchwork/sdk";
import type { EngraftDoc } from "./datatype";

// TODO: engraft's datatype is 5mb!!!!

export const dataType: DataTypeDescription<EngraftDoc> = {
  type: "patchwork:dataType",
  id: "engraft",
  name: "Engraft program",
  icon: "Sprout",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: DeferredTool[] = [
  {
    type: "patchwork:tool",
    id: "engraft",
    name: "Engraft",
    icon: "Sprout",
    supportedDataTypes: ["engraft"],
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
