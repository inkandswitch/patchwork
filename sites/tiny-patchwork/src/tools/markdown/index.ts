import { toolify } from "../../lib/toolify";

export const plugins = [
  {
    type: "patchwork:tool",
    id: "markdow",
    name: "Markdown",
    icon: "FileText",
    supportedDataTypes: ["markdown"],
    async load() {
      const { MarkdownEditor } = await import("./MarkdownEditor");
      return { render: toolify(MarkdownEditor) };
    },
  },
  {
    type: "patchwork:datatype",
    id: "markdown",
    name: "Markdown",
    icon: "FileText",
    async load() {
      const { MarkdownDataType } = await import("./datatype");
      return MarkdownDataType;
    },
  },
];
