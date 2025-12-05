import { Plugin } from "@inkandswitch/patchwork-plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "spacer",
    name: "Spacer",
    icon: "Spacer",
    supportedDatatypes: "*",
    async load() {
      const { renderSpacer } = await import("./Spacer.js");
      return renderSpacer;
    },
    unlisted: true,
    forTitleBar: true,
  },
];
