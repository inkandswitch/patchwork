import { makeTool } from "@patchwork/sdk";
import "reactflow/dist/style.css";
import { GraphView } from "./components/GraphView";

export const buildMetadataGraphView = makeTool({
  EditorComponent: GraphView,
});
