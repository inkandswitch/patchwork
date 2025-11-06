import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "history-view",
    name: "History",
    icon: "History",
    supportedDataTypes: ["account"],
    async load() {
      const { renderHistoryView } = await import("./HistoryView");
      return renderHistoryView;
    },
    unlisted: true,
  },
];
