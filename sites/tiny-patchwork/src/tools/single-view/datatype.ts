import { DataTypeImplementation } from "@patchwork/plugins";
import type { AutomergeUrl } from "@automerge/vanillajs";

export interface SingleViewDoc {
  currentDocument?: { url: AutomergeUrl; toolId?: string | null };
}

export const SingleViewDataType: DataTypeImplementation<SingleViewDoc> = {
  init: (doc: SingleViewDoc) => {
    doc.currentDocument = undefined;
  },
  getTitle(doc: SingleViewDoc) {
    return "Single View";
  },
  markCopy: (doc: SingleViewDoc) => {
    doc.currentDocument = doc.currentDocument;
  },
};
