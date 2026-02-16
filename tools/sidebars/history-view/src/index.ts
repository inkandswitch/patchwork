import { Plugin } from "@inkandswitch/patchwork-plugins";
import { toolify } from "@inkandswitch/patchwork-react";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "history-view",
    category: "context-tool",
    name: "History",
    icon: "History",
    supportedDatatypes: ["account"],
    async load() {
      const { renderHistoryView } = await import("./HistoryView");
      return renderHistoryView;
    },
    unlisted: true,
  },
  {
    type: "patchwork:tool",
    id: "highlight-changes-checkbox",
    tags: ["titlebar-tool"],
    name: "Highlight Changes",
    icon: "Highlighter",
    supportedDatatypes: "*",
    async load() {
      const { HighlightChangesOption } =
        await import("./HighlightChangesCheckbox");
      return toolify(HighlightChangesOption);
    },
    unlisted: true,
    forTitleBar: true,
  },
];
