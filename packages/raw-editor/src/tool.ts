import { Tool } from "@/sdk";
import { RawEditor } from "./components/RawEditor";

export const rawEditorTool: Tool = {
  type: "patchwork:tool",
  id: "raw",
  name: "Raw",
  editorComponent: RawEditor,
  supportedDataTypes: "*",
};
