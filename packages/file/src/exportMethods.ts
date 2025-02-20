import { ExportMethod } from "@patchwork/sdk";
import { Doc } from "@automerge/automerge";
import { getFileContents, isBinaryFileDoc } from "./datatype";
import { FileDoc } from "./types";
import mime from "mime-types";
import { Repo } from "@automerge/automerge-repo";

export const universalExport: ExportMethod = {
  id: "file-universal-export",
  type: "patchwork:exportMethod",
  name: "File",
  useAsDefaultMethod: true, // This is the native format for files
  datatypeId: "file",
  fileExtensions: ["*"], // Support any file extension
  async exportData(doc: Doc<unknown>, repo: Repo) {
    const fileDoc = doc as Doc<FileDoc>;
    const isBinary = isBinaryFileDoc(fileDoc);
    const extension = fileDoc.extension ?? (isBinary ? "dat" : "txt");
    const hasExtensionAlready = /\.[a-z0-9]+$/.test(fileDoc.name);
    const fileName = hasExtensionAlready
      ? fileDoc.name
      : `${fileDoc.name}.${extension}`;
    const type =
      fileDoc.mimeType ?? mime.lookup(extension) ?? "application/octet-stream";

    return new File([getFileContents(fileDoc)], fileName, { type });
  },
};
