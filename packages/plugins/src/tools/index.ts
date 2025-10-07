import type { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import type { LoadedPlugin, PluginDescription } from "../registry/index.js";
import type { KeyhiveKit } from "@patchwork/identity";

// todo update it so that a tool exports only a function, not an object
export type ToolImplementation<T = unknown> = {
  render: ToolRender<T>;
};

// todo this shape should be (handle, element) and the extras should come
// from elsewhere
export type ToolRender<T = unknown> = ({
  handle,
  element,
  repo,
  keyhiveKit,
}: {
  handle: DocHandle<T>;
  element: ShadowRoot | HTMLElement;
  repo: Repo;
  keyhiveKit?: KeyhiveKit;
}) => () => void;

// todo this will be in the package.json
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
