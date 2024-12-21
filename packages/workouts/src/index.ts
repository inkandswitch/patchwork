import type { DataTypeDescription, ToolDescription } from "@patchwork/sdk";
import type { Doc } from "./datatype";

import "./index.css";

export const dataType: DataTypeDescription<Doc> = {
  type: "patchwork:dataType",
  id: "swole",
  name: "Swole",
  icon: "Dumbbell",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "swole",
    name: "Swole",
    icon: "Dumbbell",
    supportedDataTypes: ["swole"],
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
