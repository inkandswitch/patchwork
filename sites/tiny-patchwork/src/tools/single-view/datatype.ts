import { DataTypeImplementation } from "@patchwork/plugins";
import { DocLink } from "@patchwork/filesystem";

export interface SingleViewDoc {
  currentDocument?: DocLink;
}

export const SingleViewDataType: DataTypeImplementation<SingleViewDoc> = {
  init: (doc: SingleViewDoc) => {
    doc.currentDocument = undefined;
  },
  async getTitle(doc: SingleViewDoc) {
    return "Single View";
  },
  markCopy: (doc: SingleViewDoc) => {
    doc.currentDocument = doc.currentDocument;
  },
};
