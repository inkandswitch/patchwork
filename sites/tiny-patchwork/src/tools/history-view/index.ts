import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "history-view",
    name: "History View",
    icon: "History",
    supportedDataTypes: ["history-view"],
    async load() {
      const { renderHistoryView } = await import("./HistoryView");
      return { render: renderHistoryView };
    },
  },
];
