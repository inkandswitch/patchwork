import { Plugin } from "@patchwork/plugins";
import { toolify } from "../../lib/toolify";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "context-view",
    name: "Context View",
    icon: "TextSearch",
    supportedDataTypes: ["context-view"],
    async load() {
      const { ContextView } = await import("./ContextView");
      return toolify(ContextView);
    },
  },
  {
    type: "patchwork:datatype",
    id: "context-view",
    name: "Context View",
    icon: "TextSearch",
    async load() {
      const { ContextViewDataType } = await import("./datatype");
      return ContextViewDataType;
    },
    unlisted: true,
  },
];
