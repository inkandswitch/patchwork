import { Plugin } from "@inkandswitch/patchwork-plugins";
import { toolify } from "@inkandswitch/patchwork-react";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "back-link-button",
    tags: ["titlebar-tool"],
    name: "Back Link Button",
    icon: "ArrowLeft",
    supportedDatatypes: "*",
    async load() {
      const { BackLinkButton } = await import("./BackLinkButton");
      return toolify(BackLinkButton);
    },
    unlisted: true,
    forTitleBar: true,
  },
];
