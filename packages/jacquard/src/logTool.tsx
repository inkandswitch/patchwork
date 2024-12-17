import { makeTool } from "@patchwork/sdk";
import "reactflow/dist/style.css";
import { LogView } from "./components/LogView";

export const buildMetadataLogView = makeTool({
  EditorComponent: LogView,
});
