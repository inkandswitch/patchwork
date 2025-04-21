import { FileEditor } from "./components/FileEditor";
import { TextFileAnnotations } from "./components/TextFileAnnotations";

export const tool = {
  EditorComponent: FileEditor,
  AnnotationsViewComponent: TextFileAnnotations,
  supportsCollapseContentWithoutAnnotations: true,
};
