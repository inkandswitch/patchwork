import { render } from "solid-js/web";
import {
  Plugin,
  type ToolImplementation,
} from "@inkandswitch/patchwork-plugins";
import { HistoryGroupingsDoc } from "./types";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:datatype",
    id: "patchwork:history-change-groups",
    name: "Document History Change Groups",
    icon: "History",
    unlisted: true,
    async load() {
      return {
        init: (doc: HistoryGroupingsDoc) => {
          if (!doc.sourceDocumentUrl) return;
          Object.assign(doc, {
            ["@patchwork"]: { type: "patchwork:history-change-groups" },
            version: doc.version || 1,
            sourceDocumentUrl: doc.sourceDocumentUrl,
            updatedAt: doc.updatedAt || 0,
            throttleMs: doc.throttleMs || 30 * 60 * 1000,
            heads: doc.heads || [],
            groupings: doc.groupings || {},
          } as HistoryGroupingsDoc);
        },
        getTitle: (doc: HistoryGroupingsDoc) => {
          return `History Change Groups for ${doc.sourceDocumentUrl}`;
        },
      };
    },
  },
  {
    type: "patchwork:tool",
    id: "history-view-grjte",
    name: "History",
    icon: "History",
    supportedDatatypes: ["account"],
    async load(): Promise<ToolImplementation<any>> {
      const { HistoryTimeline } = await import("./history/HistoryTimeline");
      return function (_handle, element) {
        return render(() => <HistoryTimeline repo={element.repo} />, element);
      };
    },
  },
  {
    type: "patchwork:tool",
    id: "highlight-changes-checkbox-grjte",
    name: "Highlight Changes",
    icon: "Highlighter",
    supportedDatatypes: "*",
    async load(): Promise<ToolImplementation<any>> {
      const { HighlightChangesOption } =
        await import("./highlight/HighlightChangesCheckbox");
      return function (_handle, element) {
        return render(
          () => <HighlightChangesOption repo={element.repo} />,
          element
        );
      };
    },
    unlisted: true,
    forTitleBar: true,
  },
];
