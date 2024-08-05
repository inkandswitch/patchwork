import { Tool } from "@/tools";
import { TLDraw } from "./components/TLDraw";
import { TLDrawAnnotations } from "./components/TLDrawAnnotations";

export const drawingTool: Tool = {
  type: "patchwork:tool",
  id: "tldraw",
  name: "Drawing",
  supportedDataTypes: ["tldraw"],
  EditorComponent: TLDraw,
  AnnotationsViewComponent: TLDrawAnnotations,
};
