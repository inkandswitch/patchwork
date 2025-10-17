import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "comments-view",
    name: "Comments View",
    icon: "",
    supportedDataTypes: "*",
    async load() {
      const { renderCommentsView } = await import("./CommentsView");
      return { render: renderCommentsView };
    },
  },
];
