import { Plugin } from "@inkandswitch/patchwork-plugins";
import { toolify } from "@patchwork/react";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "add-doc-to-sidebar-button",
    name: "Add doc to sidebar button",
    icon: "Plus",
    supportedDatatypes: "*",
    async load() {
      const { AddDocToSidebarButton } = await import("./AddDocToSidebarButton");
      return toolify(AddDocToSidebarButton);
    },
    unlisted: true,
    forTitleBar: true,
  },
];
