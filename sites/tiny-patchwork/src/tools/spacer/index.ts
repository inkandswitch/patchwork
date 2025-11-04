import { Plugin } from "@patchwork/plugins";
import { toolify } from "../../lib/toolify";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "spacer",
    name: "Spacer",
    icon: "Spacer",
    supportedDataTypes: "*",
    async load() {
      const { renderSpacer } = await import("./Spacer");
      return renderSpacer;
    },
    unlisted: true,
  },
];
