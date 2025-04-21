import { EssayAnnotations } from "./components/EssayAnnotations";
import { EssayEditor } from "./components/EssayEditor";

export const tool = {
  EditorComponent: EssayEditor,
  AnnotationsViewComponent: EssayAnnotations,
  supportsInlineComments: true,
  supportsCollapseContentWithoutAnnotations: true,
};
