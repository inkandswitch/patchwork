import { Plugin } from "@inkandswitch/patchwork-plugins";
import { toolify } from "@inkandswitch/patchwork-react";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "frame-configurator",
    name: "Frame Configurator",
    icon: "Settings",
    supportedDatatypes: ["account"],
    async load() {
      const { FrameConfigurator } = await import("./FrameConfigurator");
      return toolify(FrameConfigurator);
    },
  },
];
