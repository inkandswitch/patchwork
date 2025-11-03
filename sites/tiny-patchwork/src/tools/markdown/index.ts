import { toolify } from "../../lib/toolify";
import "./index.css";

export const plugins = [
  {
    type: "patchwork:tool",
    id: "markdown",
    name: "Markdown",
    icon: "FileText",
    supportedDataTypes: ["markdown", "essay"],
    async load() {
      const { MarkdownEditor } = await import("./MarkdownEditor");
      return toolify(MarkdownEditor);
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
