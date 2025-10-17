import { DataTypeImplementation } from "@patchwork/plugins";
import type { AutomergeUrl } from "@automerge/vanillajs";

export interface SingleViewDoc {
  selection?: { url: AutomergeUrl; toolId?: string | null };
}

export const SingleViewDataType: DataTypeImplementation<SingleViewDoc> = {
  init: (doc: SingleViewDoc) => {
    doc.selection = undefined;
  },
  getTitle() {
    return "Single View";
  },
  markCopy: () => {},
};
