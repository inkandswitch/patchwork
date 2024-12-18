import { makeTool } from "@patchwork/sdk";
import { FileEditor } from "./components/FileEditor";
import { TextFileAnnotations } from "./components/TextFileAnnotations";

export const tool = makeTool({
  EditorComponent: FileEditor,
  AnnotationsViewComponent: TextFileAnnotations,
  supportsCollapseContentWithoutAnnotations: true,
});
