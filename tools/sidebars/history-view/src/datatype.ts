import { DatatypeImplementation } from "@inkandswitch/patchwork-plugins";

export type HistoryViewDoc = Record<string, never>;

export const HistoryViewDatatype: DatatypeImplementation<HistoryViewDoc> = {
  init: () => {},
  getTitle() {
    return "History View";
  },
};
