import { makeTool } from "@patchwork/sdk";
import { EngraftEditor } from "./components/EngraftEditor";

export const tool = makeTool({
  EditorComponent: EngraftEditor,
});
