import { makeTool } from "@/sdk";
import { FileEditor } from "./components/FileEditor";
import { TextFileAnnotations } from "./components/TextFileAnnotations";

export const fileTool = makeTool({
  type: "patchwork:tool",
  id: "file",
  name: "File",
  EditorComponent: FileEditor,
  AnnotationsViewComponent: TextFileAnnotations,
  supportedDataTypes: ["file"],
});
