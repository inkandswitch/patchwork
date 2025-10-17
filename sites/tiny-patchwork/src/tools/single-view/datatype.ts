import { DataTypeImplementation } from "@patchwork/plugins";
import type { AutomergeUrl } from "@automerge/vanillajs";

export interface SingleViewDoc {
  selection?: { url: AutomergeUrl; toolId?: string | null };
  highlightChanges: boolean;
}

export const SingleViewDataType: DataTypeImplementation<SingleViewDoc> = {
  init: (doc: SingleViewDoc) => {
    doc.selection = undefined;
    doc.highlightChanges = false;
  },
  getTitle() {
    return "Single View";
  },
  markCopy: () => {},
};
