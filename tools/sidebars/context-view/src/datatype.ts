import { DataTypeImplementation } from "@inkandswitch/patchwork-plugins";

export type ContextViewDoc = Record<string, never>;

export const ContextViewDataType: DataTypeImplementation<ContextViewDoc> = {
  init: () => {},
  getTitle() {
    return "Context View";
  },
};
