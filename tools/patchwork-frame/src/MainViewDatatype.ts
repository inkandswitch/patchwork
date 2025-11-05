import { AutomergeUrl } from "@automerge/automerge-repo";
import { DataTypeImplementation } from "@patchwork/plugins";

export type MainViewDoc = {
  toolbarItems: { docUrl: AutomergeUrl | "currentDoc"; toolId: string }[];
};

export const MainViewDataType: DataTypeImplementation<MainViewDoc> = {
  init: (doc: MainViewDoc) => {
    doc.toolbarItems = [];
  },
  getTitle() {
    return "Main View";
  },
};


