import { Plugin } from "@inkandswitch/patchwork-plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "comments-view",
    name: "Comments",
    icon: "Comments",
    supportedDataTypes: ["account"],
    async load() {
      const { renderCommentsView } = await import("./CommentsView");
      return renderCommentsView;
    },
  },
];
