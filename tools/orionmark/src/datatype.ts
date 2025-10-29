import type { DataTypeImplementation } from "@patchwork/plugins";

export type MarkdownDoc = {
  content: string;
};

export const dataType: DataTypeImplementation<MarkdownDoc> = {
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
  markCopy: (doc: MarkdownDoc) => {
    // Could prepend "Copy of " to first heading if desired
    doc.content = "Copy of " + doc.content;
  },
};
