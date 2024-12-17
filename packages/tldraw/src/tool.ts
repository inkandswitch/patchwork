import { makeTool } from "@patchwork/sdk";
import { TLDraw } from "./components/TLDraw";
import { TLDrawAnnotations } from "./components/TLDrawAnnotations";

export const tool = makeTool({
  EditorComponent: TLDraw,
  AnnotationsViewComponent: TLDrawAnnotations,
});
