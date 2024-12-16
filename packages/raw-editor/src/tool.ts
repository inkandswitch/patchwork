import { Tool } from "@patchwork/sdk";
import { RawEditor } from "./components/RawEditor";

export const tool: Tool = {
  type: "patchwork:tool",
  id: "raw",
  name: "Raw",
  EditorComponent: RawEditor,
  supportedDataTypes: "*",
};
