import { makeTool } from "@patchwork/sdk";
import { FileEditor } from "./components/FileEditor";
import { TextFileAnnotations } from "./components/TextFileAnnotations";

export const tool = makeTool({
  type: "patchwork:tool",
  id: "file",
  name: "File",
  EditorComponent: FileEditor,
  AnnotationsViewComponent: TextFileAnnotations,
  supportedDataTypes: ["file"],
  supportsCollapseContentWithoutAnnotations: true,
});
