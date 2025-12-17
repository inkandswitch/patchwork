import { Plugin } from "@inkandswitch/patchwork-plugins";
import { toolify } from "@inkandswitch/patchwork-react";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "context-view",
    name: "Context",
    icon: "TextSearch",
    supportedDatatypes: ["context-view"],
    async load() {
      const { ContextView } = await import("./ContextView");
      return toolify(ContextView);
    },
  },
];
