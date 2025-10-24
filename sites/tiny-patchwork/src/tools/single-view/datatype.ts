import { DataTypeImplementation } from "@patchwork/plugins";
import type { AutomergeUrl } from "@automerge/vanillajs";

export interface SingleViewDoc {
  highlightChanges: boolean;
}

export const SingleViewDataType: DataTypeImplementation<SingleViewDoc> = {
  init: (doc: SingleViewDoc) => {
    doc.highlightChanges = false;
  },
  getTitle() {
    return "Single View";
  },
  markCopy: () => {},
};
