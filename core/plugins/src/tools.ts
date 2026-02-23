import type { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import type { PluginDescription } from "./registry/index.js";
import {
  getType,
  type HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import { getRegistry } from "./registry/index.js";

import type { initializeAutomergeRepoKeyhive } from "@automerge/automerge-repo-keyhive";
type AutomergeRepoKeyhive = Awaited<
  ReturnType<typeof initializeAutomergeRepoKeyhive>
>;

export type ToolImplementation<T = unknown> = ToolRender<T>;

export type ToolElement = HTMLElement & {
  repo: Repo;
  hive?: AutomergeRepoKeyhive;
};

export type ToolRender<T = unknown> = (
  handle: DocHandle<T>,
  element: ToolElement
) => () => void;

export type ToolDescription = PluginDescription & {
  id: string;
  tags?: string[];
  type: "patchwork:tool";
  supportedDatatypes: "*" | string[];
  name: string;
  icon?: string;
  unlisted?: boolean;
  forTitleBar?: boolean;
};

export type Tool = ToolDescription;

export type LegacyEditorProps = { docUrl: AutomergeUrl };

export function getSupportedToolsForType(type: string): ToolDescription[] {
  return getRegistry<ToolDescription>("patchwork:tool").filter((desc) => {
    return (
      desc.supportedDatatypes?.includes(type) ||
      desc.supportedDatatypes?.includes("*")
    );
  });
}

export function getSupportedTools(
  doc: HasPatchworkMetadata
): ToolDescription[] {
  const type = getType(doc);
  if (!type) return [];
  return getSupportedToolsForType(type);
}

export function getFallbackTool(
  doc: HasPatchworkMetadata
): ToolDescription | undefined {
  const type = getType(doc)!;
  const plugins = getSupportedTools(doc);
  return sortPlugins(plugins, "supportedDatatypes", type, "id")?.filter(
    (tool) => !tool.unlisted
  )?.[0];
}

const sortPlugins = (
  plugins: ToolDescription[],
  matchField: keyof ToolDescription,
  matchValue: string,
  sortField?: keyof ToolDescription
): ToolDescription[] => {
  return [...plugins].sort((a, b) => {
    const aValue = a[matchField];
    const bValue = b[matchField];

    const aArray = Array.isArray(aValue)
      ? (aValue as string[])
      : [aValue as string];
    const bArray = Array.isArray(bValue)
      ? (bValue as string[])
      : [bValue as string];

    const aHasWildcard = aArray.includes("*");
    const bHasWildcard = bArray.includes("*");
    const aHasMatch = aArray.includes(matchValue);
    const bHasMatch = bArray.includes(matchValue);

    if (aHasMatch && !bHasMatch) return -1;
    if (!aHasMatch && bHasMatch) return 1;

    if (aHasWildcard && !bHasWildcard) return 1;
    if (!aHasWildcard && bHasWildcard) return -1;

    if (sortField) {
      const aSort = a[sortField];
      const bSort = b[sortField];
      if (typeof aSort === "string" && typeof bSort === "string") {
        return aSort.localeCompare(bSort);
      }
    }

    return 0;
  });
};
