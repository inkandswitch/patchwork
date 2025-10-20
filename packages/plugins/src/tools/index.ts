import type { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import type { LoadedPlugin, PluginDescription } from "../registry/index.js";

import type { initializeKeyhive } from "@automerge/automerge-repo-keyhive";
type AutomergeRepoKeyhive = Awaited<ReturnType<typeof initializeKeyhive>>;

export type ToolImplementation<T = unknown> = ToolRender<T>;

// todo(chee): repo and hive on here might be temporary, think about it
export type ToolElement = HTMLElement & {
  repo: Repo;
  hive?: AutomergeRepoKeyhive;
};

// todo this shape should be (handle, element) and the extras should come
// from elsewhere
export type ToolRender<T = unknown> = (
  handle: DocHandle<T>,
  element: ToolElement
) => () => void;

// todo this will be in the package.json
export type ToolDescription = PluginDescription & {
  id: string;
  type: "patchwork:tool";
  supportedDataTypes: "*" | string[];
  name: string;
  icon?: string;
};

export type Tool = LoadedPlugin<ToolDescription, ToolImplementation>;

export type LegacyEditorProps = { docUrl: AutomergeUrl };
