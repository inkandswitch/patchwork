import { DataTypeImplementation } from "@patchwork/plugins";
import type { AutomergeUrl } from "@automerge/automerge-repo";

export interface TabViewDoc {
  tabs: { url: AutomergeUrl; toolId?: string }[];
  activeTabIndex?: number;
}

export const TabViewDataType: DataTypeImplementation<TabViewDoc> = {
  init: (doc: TabViewDoc) => {
    doc.tabs = [];
  },
  getTitle(doc: TabViewDoc) {
    return "Tab Viewer";
  },
  markCopy: (doc: TabViewDoc) => {
    doc.tabs = doc.tabs;
    doc.activeTabIndex = doc.activeTabIndex;
  },
};
