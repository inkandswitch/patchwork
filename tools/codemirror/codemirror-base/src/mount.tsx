/** @jsxImportSource solid-js */
import { render } from "solid-js/web";
import { CodeMirrorEditor } from "./tool.tsx";
import type { TextDoc } from "./tool.tsx";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";

const mount: ToolImplementation<TextDoc> = (handle, element) => {
  return render(
    () => <CodeMirrorEditor handle={handle} repo={element.repo} />,
    element
  );
};

export default mount;
