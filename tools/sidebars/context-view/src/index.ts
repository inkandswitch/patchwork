import { Plugin } from "@patchwork/plugins";
import { toolify } from "@patchwork/react";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "context-view",
    name: "Context",
    icon: "TextSearch",
    supportedDataTypes: ["context-view"],
    async load() {
      const { ContextView } = await import("./ContextView");
      return toolify(ContextView);
    },
  },
];
