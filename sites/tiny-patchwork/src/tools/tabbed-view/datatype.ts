import { DataTypeImplementation } from "@patchwork/plugins";
import type { AutomergeUrl } from "@automerge/automerge-repo";

export interface TabbedViewDoc {
  tabs: { url: AutomergeUrl; toolId?: string; name?: string }[];
  activeTabIndex?: number;
  showCloseButton?: boolean;
}

export const TabbedViewDataType: DataTypeImplementation<TabbedViewDoc> = {
  init: (doc: TabbedViewDoc) => {
    doc.tabs = [];
  },
  getTitle() {
    return "Tabbed View";
  },
};
