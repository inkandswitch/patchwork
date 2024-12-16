import type { DeferredDataType, DeferredTool } from "@patchwork/sdk";
import type { SequencerDoc, SequencerDocAnchor } from "./datatype";

export const dataType: DeferredDataType<
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

export const tools: DeferredTool[] = [
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
