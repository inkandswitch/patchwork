import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "branch-view",
    name: "Branch View",
    icon: "GitBranch",
    supportedDataTypes: ["branch-view"],
    async load() {
      const { renderBranchView } = await import("./BranchView");
      return renderBranchView;
    },
  },
  {
    type: "patchwork:datatype",
    id: "branch-view",
    name: "Branch View",
    icon: "GitBranch",
    unlisted: true,
    async load() {
      const { BranchViewDataType } = await import("./datatype");
      return BranchViewDataType;
    },
  },
];
