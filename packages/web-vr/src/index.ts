import type { DataTypeDescription, ToolDescription } from "@patchwork/sdk";
import type { Doc } from "./datatype";

export const dataType: DataTypeDescription<Doc> = {
  type: "patchwork:dataType",
  id: "webvr",
  name: "WebVR",
  icon: "Glasses",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    id: "webvr",
    type: "patchwork:tool",
    supportedDataTypes: ["webvr"],
    name: "WebVR",
    icon: "Glasses",
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
