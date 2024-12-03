import { makeTool } from "@patchwork/sdk";
import { AmbSheet } from "./components/AmbSheet";

export const tool = makeTool({
  type: "patchwork:tool",
  id: "ambsheet",
  name: "Ambsheet",
  supportedDataTypes: ["ambsheet"],
  EditorComponent: AmbSheet,
});
