/** @jsxImportSource solid-js */
import { render } from "solid-js/web";
import type { ToolImplementation } from "@patchwork/plugins";
import type { TextDoc } from "./tool.tsx";

export const plugins = [
  {
    type: "patchwork:tool",
    id: "codemirror-base",
    // TODO: this name is a placeholder for now, since there isn't a way to specify codemirror extension sets by name
    name: "Markdown Editor",
    supportedDataTypes: ["*"],
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
