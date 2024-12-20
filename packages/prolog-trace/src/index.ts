import type { DataTypeDescription, ToolDescription } from "@patchwork/sdk";
import type { PrologTraceAnchor, TraceDoc } from "./datatype";

import "./index.css";

export const dataType: DataTypeDescription<
  TraceDoc,
  PrologTraceAnchor,
  string
> = {
  type: "patchwork:dataType",
  id: "prolog-trace",
  name: "Prolog Trace",
  icon: "Code",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "prolog-trace",
    name: "Prolog Trace",
    icon: "Code",
    supportedDataTypes: ["prolog-trace"],
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
