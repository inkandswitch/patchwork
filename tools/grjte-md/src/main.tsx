/** @jsxImportSource solid-js */
import { render } from "solid-js/web";
import type { ToolImplementation } from "@patchwork/plugins";
import type { MarkdownDoc } from "./tool.tsx";

export const plugins = [
  {
    type: "patchwork:tool",
    id: "grjte-markdown-tool",
    name: "grjte Markdown",
    supportedDataTypes: ["markdown", "essay"],
    async load(): Promise<ToolImplementation<MarkdownDoc>> {
      const { MarkdownEditor } = await import("./tool.tsx");
      return function (handle, element) {
        return render(
          () => <MarkdownEditor handle={handle} repo={element.repo} />,
          element
        );
      };
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
