import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "comments-view",
    name: "Comments View",
    icon: "",
    supportedDataTypes: "*",
    async load() {
      const { renderHistoryView } = await import("./CommentsView");
      return { render: renderHistoryView };
    },
  },
];
