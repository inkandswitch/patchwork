import { Plugin } from "@inkandswitch/patchwork-plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "add-doc-to-sidebar-button",
    tags: ["titlebar-tool"],
    name: "Add doc to sidebar button",
    icon: "Plus",
    supportedDatatypes: "*",
    async load() {
      const { renderAddDocToSidebarButton } = await import(
        "./AddDocToSidebarButton.js"
      );
      return renderAddDocToSidebarButton;
    },
    unlisted: true,
    forTitleBar: true,
  },
];
