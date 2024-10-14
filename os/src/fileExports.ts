import { Doc, save } from "@automerge/automerge";
import { Repo } from "@automerge/automerge-repo";

export type FileExportMethod<D> = {
  id: string;
  /** A human readable name for the export method. */
  exportMethodName: string | ((doc: Doc<D>) => string);
  /** A function that exports the document to a blob. */
  export: (doc: Doc<D>, repo: Repo) => Promise<Blob> | Blob;
  /** The MIME type of the exported file. */
  contentType: string | ((doc: Doc<D>) => string);
  /** The file extension to use for the exported file.*/
  fileExtension: string | ((doc: Doc<D>) => string);

  /** The full filename for the exported file, including file extension.
   *  If this option is present, the file extension option will be ignored.
   */
  filename?: (doc: Doc<D>) => string;
};

const rawAutomergeExport: FileExportMethod<any> = {
  id: "automerge",
  exportMethodName: "Automerge Binary",
  export: (doc) => new Blob([save(doc)], { type: "application/octet-stream" }),
  contentType: "application/octet-stream",
  fileExtension: "automerge",
};

const jsonExport: FileExportMethod<any> = {
  id: "json",
  exportMethodName: "JSON",
  export: (doc) =>
    new Blob([JSON.stringify(doc)], { type: "application/json" }),
  contentType: "application/json",
  fileExtension: "json",
};

export const genericExportMethods = [rawAutomergeExport, jsonExport];
