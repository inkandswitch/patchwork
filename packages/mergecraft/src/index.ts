import type { DataTypeDescription, ToolDescription } from "@patchwork/sdk";
import type { Doc } from "./datatype";

export const dataType: DataTypeDescription<Doc> = {
  type: "patchwork:dataType",
  id: "mergecraft",
  name: "Mergecraft",
  icon: "Glasses",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    id: "mergecraft",
    type: "patchwork:tool",
    supportedDataTypes: ["mergecraft"],
    name: "Mergecraft",
    icon: "Glasses",
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
