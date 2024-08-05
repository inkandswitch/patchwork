import { Tool } from "@/tools";
import "reactflow/dist/style.css";
import { GraphView } from "./components/GraphView";
import { LogView } from "./components/LogView";

export const buildMetadataGraphView: Tool = {
  type: "patchwork:tool",
  id: "jacquard-build-metadata-graph-view",
  name: "Graph",
  supportedDataTypes: ["jacquard-build-metadata"],
  EditorComponent: GraphView,
};

export const buildMetadataLogView: Tool = {
  type: "patchwork:tool",
  id: "jacquard-build-metadata-log-view",
  name: "Log",
  supportedDataTypes: ["jacquard-build-metadata"],
  EditorComponent: LogView,
};
