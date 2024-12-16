import { makeTool } from "@patchwork/sdk";
import "reactflow/dist/style.css";
import { GraphView } from "./components/GraphView";

export const buildMetadataGraphView = makeTool({
  type: "patchwork:tool",
  id: "jacquard-build-metadata-graph-view",
  name: "Graph",
  supportedDataTypes: ["jacquard-build-metadata"],
  EditorComponent: GraphView,
});
