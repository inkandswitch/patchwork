import { Plugin } from "@patchwork/plugins";
import { toolify } from "../../lib/toolify";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "frame-configurator",
    name: "Frame Configurator",
    icon: "Settings",
    supportedDataTypes: ["account"],
    async load() {
      const { FrameConfigurator } = await import("./FrameConfigurator");
      return toolify(FrameConfigurator);
    },
  },
  {
    type: "codemirror:extension",
    id: "frame-configurator",
    name: "Frame Configurator",
    icon: "Settings",
    supportedDataTypes: ["account"],
    async load() {
      const { FrameConfigurator } = await import("./FrameConfigurator");
      return toolify(FrameConfigurator);
    },
  },
];
