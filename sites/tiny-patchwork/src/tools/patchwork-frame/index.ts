import { Plugin } from "@patchwork/plugins";
import { toolify } from "../../lib/toolify";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "patchwork-frame",
    name: "Patchwork Frame",
    icon: "Window",
    supportedDataTypes: ["account"],
    async load() {
      const { PatchworkFrame } = await import("./PatchworkFrame");
      return toolify(PatchworkFrame);
    },
  },
  {
    type: "patchwork:datatype",
    id: "patchwork/main-view",
    name: "Patchwork Main View",
    icon: "Eye",
    async load() {
      const { MainViewDataType } = await import("./MainViewDatatype");
      return MainViewDataType;
    },
    unlisted: true,
  },
];
