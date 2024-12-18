import { makeTool } from "@patchwork/sdk";
import { RawEditor } from "./components/RawEditor";

export const tool = makeTool({
  EditorComponent: RawEditor,
});
