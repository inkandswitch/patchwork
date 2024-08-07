import { makeTool } from "@/tools";
import { EssayAnnotations } from "./components/EssayAnnotations";
import { EssayEditor } from "./components/EssayEditor";

export const essayEditorTool = makeTool({
  type: "patchwork:tool",
  id: "essay",
  name: "Editor",
  supportedDataTypes: ["essay"],
  EditorComponent: EssayEditor,
  AnnotationsViewComponent: EssayAnnotations,
  supportsInlineComments: true,
});
