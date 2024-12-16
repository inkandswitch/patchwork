import { makeTool } from "@patchwork/sdk";
import { TLDraw } from "./components/TLDraw";
import { TLDrawAnnotations } from "./components/TLDrawAnnotations";

export const tool = makeTool({
  type: "patchwork:tool",
  id: "tldraw",
  name: "Drawing",
  supportedDataTypes: ["tldraw"],
  EditorComponent: TLDraw,
  AnnotationsViewComponent: TLDrawAnnotations,
});
