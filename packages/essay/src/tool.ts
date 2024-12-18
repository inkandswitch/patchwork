import { makeTool } from "@patchwork/sdk";
import { EssayAnnotations } from "./components/EssayAnnotations";
import { EssayEditor } from "./components/EssayEditor";

export const tool = makeTool({
  EditorComponent: EssayEditor,
  AnnotationsViewComponent: EssayAnnotations,
  supportsInlineComments: true,
  supportsCollapseContentWithoutAnnotations: true,
});
