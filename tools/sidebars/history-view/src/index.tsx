import { render } from "solid-js/web";
import {
  Plugin,
  type ToolImplementation,
} from "@inkandswitch/patchwork-plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:datatype",
    id: "patchwork:history-change-groups",
    name: "Document History Change Groups",
    icon: "History",
    unlisted: true,
    async load() {
      const { ChangeGroupsDataType } = await import("./datatype.js");
      return ChangeGroupsDataType;
    },
  },
  {
    type: "patchwork:tool",
    id: "history-view-grjte",
    name: "History",
    icon: "History",
    supportedDatatypes: ["account"],
    async load(): Promise<ToolImplementation<any>> {
      const { HistoryTimeline } = await import("./HistoryTimeline");
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
        await import("./HighlightChangesCheckbox");
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
