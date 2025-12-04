import { Plugin } from "@inkandswitch/patchwork-plugins";
import { toolify } from "@patchwork/react";

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
];
