import type { DataTypeDescription, ToolDescription } from "@patchwork/sdk";
import type { Doc } from "./datatype";

export const dataType: DataTypeDescription<Doc> = {
  type: "patchwork:dataType",
  id: "chat",
  name: "Chat",
  icon: "Speech",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    id: "chat",
    type: "patchwork:tool",
    supportedDataTypes: ["chat"],
    name: "Chat",
    icon: "Speech",
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
