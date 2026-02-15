import { Plugin } from "@inkandswitch/patchwork-plugins";
import { toolify } from "@inkandswitch/patchwork-react";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "document-title",
    tags: ["titlebar-tool"],
    name: "Document Title",
    icon: "Heading",
    supportedDatatypes: "*",
    async load() {
      const { DocumentTitle } = await import("./DocumentTitle");
      return toolify(DocumentTitle);
    },
    unlisted: true,
    forTitleBar: true,
  },
];
