/** @jsxImportSource solid-js */
import { render } from "solid-js/web";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";
import type { TextDoc } from "./tool.tsx";

// Re-export types for use by extensions
export { type EditorContext } from "./lib/extensions/context.ts";

export const plugins = [
  {
    type: "patchwork:tool",
    id: "codemirror-base",
    name: "Text Editor",
    supportedDatatypes: ["essay", "markdown"],
    async load(): Promise<ToolImplementation<TextDoc>> {
      const { CodeMirrorEditor } = await import("./tool.tsx");
      return function (handle, element) {
        return render(
          () => <CodeMirrorEditor handle={handle} repo={element.repo} />,
          element
        );
      };
    },
  },
];
