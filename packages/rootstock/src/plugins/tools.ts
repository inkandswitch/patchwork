import type { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import type { LoadedPlugin, PluginDescription } from ".";

export type ToolImplementation = {
  // TODO: chee 2025-09-12 remove this when everything has been migrated to have a render()
  EditorComponent?: React.FC<LegacyEditorProps>;
  render(props: ToolProps): void | (() => void);
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
  handle: DocHandle<T>;
  element: ShadowRoot | HTMLElement;
  repo: import("@automerge/automerge-repo").Repo;
};
