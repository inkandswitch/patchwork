import type { Extension } from "@codemirror/state";

export const plugins = [
  {
    type: "codemirror:extension",
    id: "codemirror-markdown",
    name: "Markdown",
    supportedDatatypes: ["essay", "markdown"],
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
      const { MarkdownDatatype } = await import("./datatype.js");
      return MarkdownDatatype;
    },
  },
  {
    type: "patchwork:datatype",
    id: "essay",
    name: "Markdown",
    icon: "FileText",
    unlisted: true,
    async load() {
      const { MarkdownDatatype } = await import("./datatype.js");
      return MarkdownDatatype;
    },
  },
];
