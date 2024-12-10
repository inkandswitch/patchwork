import { AutomergeUrl } from "@automerge/automerge-repo";
import { EditorProps, Tool } from "../tools";

export interface EditorPropsWithTool<T, V> extends EditorProps<T, V> {
  tool: Tool;
}

export interface SideBySideProps<T, V> extends EditorPropsWithTool<T, V> {
  mainDocUrl: AutomergeUrl;
}
