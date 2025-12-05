import type { DatatypeImplementation } from "@inkandswitch/patchwork-plugins";

export type MarkdownDoc = {
  content: string;
};

export const datatype: DatatypeImplementation<MarkdownDoc> = {
  init: (doc: MarkdownDoc) => {
    doc.content = "# Untitled";
  },
  getTitle(doc: MarkdownDoc) {
    const content = doc.content;

    // Find first markdown heading
    const titleRegex = /(^|\n)#\s(.+)/;
    const titleMatch = content.match(titleRegex);
    return titleMatch ? titleMatch[2] : "Untitled";
  },
};
