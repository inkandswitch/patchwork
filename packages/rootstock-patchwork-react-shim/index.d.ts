import { ToolImplementation, ToolProps } from "../rootstock/src";

export default function shim(
  editorComponent: ToolImplementation["EditorComponent"]
): ToolImplementation["render"];
