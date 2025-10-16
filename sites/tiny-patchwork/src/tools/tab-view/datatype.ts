import { DataTypeImplementation } from "@patchwork/plugins";
import { DocLink } from "@patchwork/filesystem";

export interface TabViewDoc {
  tabs: DocLink[];
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
