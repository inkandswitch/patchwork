import type { DataTypeDescription, ToolDescription } from "@patchwork/sdk";
import type { Doc } from "./datatype";

import "./index.css";

export const dataType: DataTypeDescription<Doc> = {
  type: "patchwork:dataType",
  id: "counter",
  name: "Counter",
  icon: "CirclePlus",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "counter",
    name: "Counter",
    icon: "CirclePlus",
    supportedDataTypes: ["counter"],
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
