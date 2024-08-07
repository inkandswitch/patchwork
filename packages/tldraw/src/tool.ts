import { makeTool } from "@/tools";
import { TLDraw } from "./components/TLDraw";
import { TLDrawAnnotations } from "./components/TLDrawAnnotations";

export const drawingTool = makeTool({
  type: "patchwork:tool",
  id: "tldraw",
  name: "Drawing",
  supportedDataTypes: ["tldraw"],
  EditorComponent: TLDraw,
  AnnotationsViewComponent: TLDrawAnnotations,
});
