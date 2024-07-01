import { Tool } from "@/sdk";
import { FileEditor } from "./components/FileEditor";

export const fileTool: Tool = {
  type: "patchwork:tool",
  id: "file",
  name: "File",
  editorComponent: FileEditor,
  supportedDataTypes: ["file"],
};
