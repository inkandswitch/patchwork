import { Doc, save } from "@automerge/automerge";
import { Repo } from "@automerge/automerge-repo";
import { DataType } from "../datatypes";

export type FileExportMethod<D> = {
  id: string;
  /** A human readable name for the export method. */
  exportMethodName: string;
  /** A function that exports the document to a blob. */
  export: (doc: Doc<D>, dataType: D, repo: Repo) => Promise<File>;
};

const rawAutomergeExport: FileExportMethod<any> = {
  id: "automerge",
  exportMethodName: "Automerge Binary",
  export: async (doc, dataType, repo) => {
    const extension = "automerge";
    const title = await dataType.getTitle(doc, repo);
    const fileName = `${title}.${extension}`;
    return new File([save(doc)], fileName, {
      type: doc.mimeType || "application/octet-stream",
    });
  },
};

const jsonExport: FileExportMethod<any> = {
  id: "json",
  exportMethodName: "JSON",
  export: async (doc, dataType: DataType, repo) => {
    const extension = "json";
    const title = await dataType.getTitle(doc, repo);
    const fileName = `${title}.${extension}`;
    return new File([JSON.stringify(doc)], fileName, {
      type: doc.mimeType || "application/octet-stream",
    });
  },
};

export const genericExportMethods = [rawAutomergeExport, jsonExport];
