import { DeferredTool } from "@patchwork/sdk";

export const rawEditorTool: DeferredTool = {
  type: "patchwork:tool",
  id: "raw",
  name: "Raw",
  supportedDataTypes: "*",
  async load() {
    return (await import("./tool")).tool;
  },
};
