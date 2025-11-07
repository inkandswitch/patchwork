import { DataTypeImplementation } from "@patchwork/plugins";

export type HistoryViewDoc = Record<string, never>;

export const HistoryViewDataType: DataTypeImplementation<HistoryViewDoc> = {
  init: () => {},
  getTitle() {
    return "History View";
  },
};
