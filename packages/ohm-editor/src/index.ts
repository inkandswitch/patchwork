import {
  makeTool,
  type DataTypeDescription,
  type ToolDescription,
} from "@patchwork/sdk";
import type { Doc } from "./datatype";

export const dataType: DataTypeDescription<Doc> = {
  type: "patchwork:dataType",
  id: "ohm",
  name: "Ohm Grammar",
  icon: "Code",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "ohm",
    name: "Ohm Grammar Editor",
    icon: "Code",
    supportedDataTypes: ["ohm"],
    async load() {
      const { Tool } = await import("./tool");
      return makeTool({ EditorComponent: Tool });
    },
  },
  {
    type: "patchwork:tool",
    id: "ohm-semantics",
    name: "Ohm Semantics Editor",
    icon: "Code",
    supportedDataTypes: ["ohm"],
    async load() {
      const { Tool } = await import("./semantics");
      return makeTool({ EditorComponent: Tool });
    },
  },
  {
    type: "patchwork:tool",
    id: "ohm-tests",
    name: "Ohm Test Editor",
    icon: "Code",
    supportedDataTypes: ["ohm"],
    async load() {
      const { Tool } = await import("./tester/tests");
      return makeTool({ EditorComponent: Tool });
    },
  },
];
