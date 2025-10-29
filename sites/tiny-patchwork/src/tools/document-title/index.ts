import { Plugin } from "@patchwork/plugins";
import { toolify } from "../../lib/toolify";

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
