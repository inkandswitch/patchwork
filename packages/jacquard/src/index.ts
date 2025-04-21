import type { Plugin } from "@patchwork/sdk";
export type { JacquardBuildMetadata, BuildRunRefreshState } from "./datatype";

export {
  getStalenessInfo,
  fetchProjectState,
  type ProjectState,
} from "./getStalenessInfo";

export const plugins: Plugin[] = [
  {
    type: "patchwork:dataType",
    id: "jacquard-build-metadata",
    name: "Jacquard Build Metadata",
    icon: "Microscope",
    unlisted: true,
    async load() {
      const { dataType } = await import("./datatype");
      return dataType;
    },
  },
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
