import { makeTool } from "@/tools";
import { EngraftEditor } from "./components/EngraftEditor";

export const engraftTool = makeTool({
  type: "patchwork:tool",
  id: "engraft",
  name: "Engraft",
  supportedDataTypes: ["engraft"],
  EditorComponent: EngraftEditor,
});
