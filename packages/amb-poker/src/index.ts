import type { DataTypeDescription, ToolDescription } from "@patchwork/sdk";
import type { AmbPokerDoc } from "./datatype";

export const dataType: DataTypeDescription<AmbPokerDoc> = {
  type: "patchwork:dataType",
  id: "ambPoker",
  name: "Amb Poker Geoffrey",
  icon: "Club",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "ambPoker",
    name: "Amb Poker Geoffrey",
    supportedDataTypes: ["ambPoker"],
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
