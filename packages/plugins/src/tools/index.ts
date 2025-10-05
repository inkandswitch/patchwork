import type { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import type { LoadedPlugin, PluginDescription } from "../registry/index.js";

export type ToolImplementation = {
  // TODO: chee 2025-09-12 remove this when everything has been migrated to
  // have a render()
  EditorComponent?: import("react").FC<LegacyEditorProps>;
  // todo revisit signature. `render(handle, element, {extras})`
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
  repo: Repo;
};
