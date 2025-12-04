import { DataTypeImplementation } from "@patchwork/plugins";

export type CommentsViewDoc = Record<string, never>;

export const CommentsViewDataType: DataTypeImplementation<CommentsViewDoc> = {
  init: () => {},
  getTitle() {
    return "Comments View";
  },
};
