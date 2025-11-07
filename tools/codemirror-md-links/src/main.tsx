import type { Extension } from "@codemirror/state";

export const plugins = [
  {
    type: "codemirror:extension",
    id: "codemirror-markdown-links",
    name: "Markdown Clickable Links",
    supportedDataTypes: ["markdown"],
    async load(): Promise<Extension> {
      const { markdownLinks } = await import("./extension.js");
      return markdownLinks();
    },
  },
];
