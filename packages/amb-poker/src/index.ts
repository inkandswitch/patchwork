import type { DeferredDataType, DeferredTool } from "@patchwork/sdk";
import type { AmbPokerDoc } from "./datatype";

export const dataType: DeferredDataType<AmbPokerDoc> = {
  type: "patchwork:dataType",
  id: "ambPoker",
  name: "Amb Poker",
  icon: "Club",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: DeferredTool[] = [
  {
    type: "patchwork:tool",
    id: "ambPoker",
    name: "Amb Poker",
    supportedDataTypes: ["ambPoker"],
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
