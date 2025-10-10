import type { ToolImplementation } from "@patchwork/plugins";

export default function patchworkReactShim(
  editorComponent: ToolImplementation["EditorComponent"]
): ToolImplementation["render"];
