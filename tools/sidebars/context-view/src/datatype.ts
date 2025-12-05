import { DatatypeImplementation } from "@inkandswitch/patchwork-plugins";

export type ContextViewDoc = Record<string, never>;

export const ContextViewDatatype: DatatypeImplementation<ContextViewDoc> = {
  init: () => {},
  getTitle() {
    return "Context View";
  },
};
