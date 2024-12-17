import type { DataTypeDescription, ToolDescription } from "@patchwork/sdk";
import type { TLDrawDoc, TLDrawDocAnchor } from "./datatype";
import type { TLShape } from "@tldraw/tldraw";

export const dataType: DataTypeDescription<
  TLDrawDoc,
  TLDrawDocAnchor,
  TLShape
> = {
  type: "patchwork:dataType",
  id: "tldraw",
  name: "Drawing",
  icon: "PenLine",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "tldraw",
    name: "Drawing",
    supportedDataTypes: ["tldraw"],
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
