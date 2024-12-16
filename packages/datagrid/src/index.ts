import type { DeferredDataType, DeferredTool } from "@patchwork/sdk";
import type { DataGridDoc, DataGridDocAnchor } from "./datatype";

export const dataType: DeferredDataType<
  DataGridDoc,
  DataGridDocAnchor,
  string
> = {
  type: "patchwork:dataType",
  id: "datagrid",
  name: "Spreadsheet",
  icon: "Sheet",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: DeferredTool[] = [
  {
    type: "patchwork:tool",
    id: "datagrid",
    name: "Spreadsheet",
    icon: "Sheet",
    supportedDataTypes: ["datagrid"],
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
