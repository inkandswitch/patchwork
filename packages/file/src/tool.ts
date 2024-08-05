import { Tool } from "@/sdk";
import { FileEditor } from "./components/FileEditor";
import { TextFileAnnotations } from "./components/TextFileAnnotations";

export const fileTool: Tool = {
  type: "patchwork:tool",
  id: "file",
  name: "File",
  EditorComponent: FileEditor,
  AnnotationsViewComponent: TextFileAnnotations,
  supportedDataTypes: ["file"],
};
