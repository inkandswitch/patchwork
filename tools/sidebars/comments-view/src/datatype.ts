import { DatatypeImplementation } from "@inkandswitch/patchwork-plugins";

export type CommentsViewDoc = Record<string, never>;

export const CommentsViewDatatype: DatatypeImplementation<CommentsViewDoc> = {
  init: () => {},
  getTitle() {
    return "Comments View";
  },
};
