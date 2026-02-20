import { Plugin } from "@inkandswitch/patchwork-plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "document-title",
    tags: ["titlebar-tool"],
    name: "Document Title",
    icon: "Heading",
    supportedDatatypes: "*",
    async load() {
      const { renderDocumentTitle } = await import("./DocumentTitle.js");
      return renderDocumentTitle;
    },
    unlisted: true,
    forTitleBar: true,
  },
];
