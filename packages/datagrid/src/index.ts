import type { Plugin } from "@patchwork/sdk";

export const plugins: Plugin[] = [
  {
    type: "patchwork:dataType",
    id: "datagrid",
    name: "Spreadsheet",
    icon: "Sheet",
    async load() {
      const { dataType } = await import("./datatype");
      return dataType;
    },
  },
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
