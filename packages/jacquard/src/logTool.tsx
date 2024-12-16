import { makeTool } from "@patchwork/sdk";
import "reactflow/dist/style.css";
import { LogView } from "./components/LogView";

export const buildMetadataLogView = makeTool({
  type: "patchwork:tool",
  id: "jacquard-build-metadata-log-view",
  name: "Log",
  supportedDataTypes: ["jacquard-build-metadata"],
  EditorComponent: LogView,
});
