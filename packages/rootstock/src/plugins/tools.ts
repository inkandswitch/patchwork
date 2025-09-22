import type { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import type { LoadedPlugin, PluginDescription } from ".";

import { KeyhiveKit } from "@patchwork/rootstock-identity";

export type ToolImplementation = {
  // TODO: chee 2025-09-12 remove this when everything has been migrated to have a render()
  EditorComponent?: React.FC<LegacyEditorProps>;
  render?(props: ToolProps): () => void;
};

export type ToolDescription = PluginDescription & {
  id: string;
  type: "patchwork:tool";
  supportedDataTypes: "*" | string[];
  name: string;
  icon?: string;
};

export type Tool = LoadedPlugin<ToolDescription, ToolImplementation>;

export type LegacyEditorProps = {
  docUrl: AutomergeUrl;
};

export type ToolProps<T = unknown> = {
  // todo: should this be handle or docUrl?
  handle: DocHandle<T>;
  // todo: naming
  element: ShadowRoot | HTMLElement;
  repo: import("@automerge/automerge-repo").Repo;
  keyhiveKit: KeyhiveKit;
};

export function render({
  handle,
  tool,
  element,
  repo,
  keyhiveKit,
}: ToolProps & { tool: ToolImplementation }): void | (() => void) {
  if (tool.render) {
    return tool.render({ handle, element, repo, keyhiveKit });
  } else if (tool.EditorComponent) {
    //   return shim(tool.EditorComponent)!({ handle, element, repo, keyhiveKit });
  }
}
