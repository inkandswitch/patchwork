import { makeTool } from "@patchwork/sdk";
import { EssayAnnotations } from "./components/EssayAnnotations";
import { EssayEditor } from "./components/EssayEditor";

export const tool = makeTool({
  type: "patchwork:tool",
  id: "essay",
  name: "Editor",
  supportedDataTypes: ["essay"],
  EditorComponent: EssayEditor,
  AnnotationsViewComponent: EssayAnnotations,
  supportsInlineComments: true,
  supportsCollapseContentWithoutAnnotations: true,
});
