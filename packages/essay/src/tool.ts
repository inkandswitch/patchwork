import { Tool } from "@/tools";
import { EssayAnnotations } from "./components/EssayAnnotations";
import { EssayEditor } from "./components/EssayEditor";

export const essayEditorTool: Tool = {
  type: "patchwork:tool",
  id: "essay",
  name: "Editor",
  supportedDataTypes: ["essay"],
  EditorComponent: EssayEditor,
  AnnotationsViewComponent: EssayAnnotations,
  supportsInlineComments: true,
};
