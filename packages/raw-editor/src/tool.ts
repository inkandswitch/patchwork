import { Tool } from "@patchwork/sdk";
import { RawEditor } from "./components/RawEditor";

export const rawEditorTool: Tool = {
  type: "patchwork:tool",
  id: "raw",
  name: "Raw Editor",
  editorComponent: RawEditor,
  supportedDataTypes: "*"
};
