import type { LegacyEditorProps, ToolImplementation } from "@patchwork/plugins";

export default function patchworkReactShim<T = unknown>(
  editorComponent: (props: LegacyEditorProps) => JSX.Element
): ToolImplementation<T>;
