import type { DataTypeDescription, ToolDescription } from "@patchwork/sdk";
import type { JacquardBuildMetadata } from "./datatype";

export type { JacquardBuildMetadata, BuildRunRefreshState } from "./datatype";

export {
  getStalenessInfo,
  fetchProjectState,
  type ProjectState,
} from "./getStalenessInfo";

export const dataType: DataTypeDescription<
  JacquardBuildMetadata,
  never,
  string
> = {
  type: "patchwork:dataType",
  id: "jacquard-build-metadata",
  name: "Jacquard Build Metadata",
  icon: "Microscope",
  unlisted: true,
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "jacquard-build-metadata-log-view",
    name: "Log",
    supportedDataTypes: ["jacquard-build-metadata"],
    async load() {
      const { buildMetadataLogView } = await import("./logTool");
      return buildMetadataLogView;
    },
  },
  {
    type: "patchwork:tool",
    id: "jacquard-build-metadata-graph-view",
    name: "Graph",
    supportedDataTypes: ["jacquard-build-metadata"],
    async load() {
      const { buildMetadataGraphView } = await import("./graphTool");
      return buildMetadataGraphView;
    },
  },
];
