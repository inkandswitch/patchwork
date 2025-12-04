import { Plugin } from "@inkandswitch/patchwork-plugins";
import { toolify } from "@patchwork/react";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "document-title",
    name: "Document Title",
    icon: "Heading",
    supportedDataTypes: "*",
    async load() {
      const { DocumentTitle } = await import("./DocumentTitle");
      return toolify(DocumentTitle);
    },
    unlisted: true,
  },
];
