import type { Extension } from "@codemirror/state";

export const plugins = [
  {
    type: "codemirror:extension",
    id: "codemirror-embed",
    name: "Patchwork Embed",
    supportedDatatypes: ["markdown"],
    async load(): Promise<Extension> {
      const { codeMirrorEmbed } = await import("./extension.js");
      return codeMirrorEmbed();
    },
  },
];
