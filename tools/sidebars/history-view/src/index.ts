import { Plugin } from "@inkandswitch/patchwork-plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "history-view",
    name: "History",
    icon: "History",
    supportedDatatypes: ["account"],
    async load() {
      const { renderHistoryView } = await import("./HistoryView");
      return renderHistoryView;
    },
    unlisted: true,
  },
];
