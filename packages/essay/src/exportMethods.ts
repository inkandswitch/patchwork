import { ExportMethod } from "@patchwork/sdk";
import { Doc } from "@automerge/automerge";
import { getTitle, MarkdownDoc } from "./datatype";
import { Repo } from "@automerge/automerge-repo";

// NOTE: zip exports with assets are in a separate package, essay-zip-export

export const markdownExport: ExportMethod = {
  id: "essay-markdown-export",
  type: "patchwork:exportMethod",
  name: "Markdown",
  useAsDefaultMethod: true,
  datatypeId: "essay",
  fileExtensions: ["md"],
  module: {
    async exportData(doc: Doc<unknown>, repo: Repo) {
      const markdownDoc = doc as Doc<MarkdownDoc>;
      const content = markdownDoc.content;

      const prefix = markdownDoc.fileName ?? (await getTitle(markdownDoc));
      const extension = markdownDoc.extension ?? "md";
      const hasExtensionAlready = /\.[a-z0-9]+$/.test(prefix);
      const fileName = hasExtensionAlready ? prefix : `${prefix}.${extension}`;
      const type = markdownDoc.mimeType ?? "text/markdown";

      return new File([content], fileName, { type });
    },
  },
};
