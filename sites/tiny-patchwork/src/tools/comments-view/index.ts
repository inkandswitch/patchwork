import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "comments-view",
    name: "Comments View",
    icon: "Comments",
    supportedDataTypes: "comments-view",
    async load() {
      const { renderCommentsView } = await import("./CommentsView");
      return renderCommentsView;
    },
  },
  {
    type: "patchwork:datatype",
    id: "comments-view",
    name: "Todo List",
    icon: "Comments",
    async load() {
      const { CommentsViewDataType } = await import("./datatype");
      return CommentsViewDataType;
    },
    unlisted: true,
  },
];
