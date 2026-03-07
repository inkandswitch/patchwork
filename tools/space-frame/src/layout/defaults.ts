import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { SpaceLayout, SpaceNode } from "./types";

export type AccountConfig = {
  accountSidebarToolId: string;
  contextSidebarToolId: string;
  documentToolbarToolIds: string[];
};

export function createDefaultLayout(
  accountDocUrl: AutomergeUrl,
  config: AccountConfig
): SpaceLayout {
  const sidebar: SpaceNode = {
    id: "sidebar",
    size: 0.2,
    collapsible: true,
    content: {
      type: "view",
      toolId: config.accountSidebarToolId,
      docUrl: accountDocUrl,
    },
  };

  const toolbar: SpaceNode = {
    id: "toolbar",
    fixedSize: 40,
    content: {
      type: "view",
      toolId: "document-toolbar-group",
    },
  };

  const main: SpaceNode = {
    id: "main",
    content: { type: "view" },
  };

  const center: SpaceNode = {
    id: "center",
    direction: "vertical",
    size: 0.6,
    children: [toolbar, main],
  };

  const context: SpaceNode = {
    id: "context",
    size: 0.2,
    collapsible: true,
    content: {
      type: "view",
      toolId: config.contextSidebarToolId,
      docUrl: accountDocUrl,
    },
  };

  const root: SpaceNode = {
    id: "root",
    direction: "horizontal",
    children: [sidebar, center, context],
  };

  return { root };
}
