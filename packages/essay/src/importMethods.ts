import { ImportMethod } from "@patchwork/sdk";
import { DocHandle } from "@automerge/automerge-repo";
import { MarkdownDoc } from "./datatype";

export const markdownImport: ImportMethod = {
  id: "essay-markdown-import",
  type: "patchwork:importMethod",
  name: "Markdown",
  datatypeId: "essay",
  useAsDefaultMethod: true,
  fileExtensions: ["md"],
    module: {
    async importData(file: File, handle: DocHandle<unknown>) {
      const content = await file.text();
      if (typeof content !== "string") {
        throw new Error("Expected content to be a string");
      }

      const doc = await handle.doc();
      if (!doc) {
        throw new Error("Document not found");
      }

      const extension = file.name.split(".").pop();
      (handle as DocHandle<MarkdownDoc>).change((doc) => {
        doc.fileName = file.name;
        if (extension) doc.extension = extension;
        doc.mimeType = file.type;
        doc.content = content;
      });

      return { didChange: true };
    },
  }
};
