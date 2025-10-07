import type { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import type { LoadedPlugin, PluginDescription } from "../registry/index.js";
import type { KeyhiveKit } from "@patchwork/identity";

export type ToolImplementation<T = unknown> = {
  render: ToolRender<T>;
};

export type ToolRender<T = unknown> = (
  handle: DocHandle<T>,
  element: ShadowRoot | HTMLElement,
  { repo, identity }: { repo: Repo; identity?: KeyhiveKit }
) => () => void;

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
