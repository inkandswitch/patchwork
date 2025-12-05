import { Plugin } from "@inkandswitch/patchwork-plugins";
import { toolify } from "@patchwork/react";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "back-link-button",
    name: "Back Link Button",
    icon: "ArrowLeft",
    supportedDatatypes: "*",
    async load() {
      const { BackLinkButton } = await import("./BackLinkButton");
      return toolify(BackLinkButton);
    },
    unlisted: true,
  },
];
