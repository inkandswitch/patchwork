import { Plugin } from "@patchwork/plugins";
import { toolify } from "@patchwork/react";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "highlight-changes-checkbox",
    name: "Highlight Changes",
    icon: "Highlighter",
    supportedDataTypes: "*",
    async load() {
      const { HighlightChangesOption } = await import(
        "./HighlightChangesCheckbox"
      );
      return toolify(HighlightChangesOption);
    },
    unlisted: true,
  },
];
