import type { DataTypeDescription, ToolDescription } from "@patchwork/sdk";
import type { SequencerDoc, SequencerDocAnchor } from "./datatype";

export const dataType: DataTypeDescription<
  SequencerDoc,
  SequencerDocAnchor,
  string
> = {
  type: "patchwork:dataType",
  id: "sequencer",
  name: "Sequencer",
  icon: "CassetteTape",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "sequencer",
    name: "Sequencer",
    supportedDataTypes: ["sequencer"],
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
