import type { Extension } from "@codemirror/state";

export const plugins = [
  {
    type: "codemirror:extension",
    id: "codemirror-markdown",
    name: "Markdown",
    supportedDataTypes: ["essay", "markdown"],
    async load(): Promise<Extension> {
      const { markdownExtensions } = await import("./extension.js");
      return markdownExtensions();
    },
  },
  {
    type: "patchwork:datatype",
    id: "markdown",
    name: "Markdown",
    icon: "FileText",
    async load() {
      const { MarkdownDataType } = await import("./datatype.js");
      return MarkdownDataType;
    },
  },
];
