import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { SpaceLayout, SpaceItem } from "./types";

export type AccountConfig = {
  accountSidebarToolId: string;
  contextSidebarToolId: string;
  documentToolbarToolIds: string[];
};

/**
 * Generate the default layout that replicates the current patchwork-frame.
 * Grid dimensions are computed at runtime from the window, so positions
 * here are expressed as fractions of the total grid that get resolved
 * by `resolveDefaultLayout`.
 */
export function createDefaultLayout(
  accountDocUrl: AutomergeUrl,
  config: AccountConfig,
  gridCols: number,
  gridRows: number
): SpaceLayout {
  const sidebarCols = Math.max(2, Math.round(gridCols * 0.17));
  const contextCols = Math.max(2, Math.round(gridCols * 0.17));
  const centerCols = gridCols - sidebarCols - contextCols;
  const toolbarRows = 1;
  const mainRows = gridRows - toolbarRows;

  const sidebar: SpaceItem = {
    id: "sidebar",
    col: 0,
    row: 0,
    cols: sidebarCols,
    rows: gridRows,
    collapsible: true,
    content: {
      type: "view",
      toolId: config.accountSidebarToolId,
      docUrl: accountDocUrl,
    },
  };

  const toolbar: SpaceItem = {
    id: "toolbar",
    col: 0,
    row: 0,
    cols: centerCols,
    rows: toolbarRows,
    content: {
      type: "view",
      toolId: "document-toolbar-group",
    },
  };

  const main: SpaceItem = {
    id: "main",
    col: 0,
    row: toolbarRows,
    cols: centerCols,
    rows: mainRows,
    content: { type: "view" },
  };

  const center: SpaceItem = {
    id: "center",
    col: sidebarCols,
    row: 0,
    cols: centerCols,
    rows: gridRows,
    content: {
      type: "group",
      children: [toolbar, main],
      pipes: [],
    },
  };

  const context: SpaceItem = {
    id: "context",
    col: sidebarCols + centerCols,
    row: 0,
    cols: contextCols,
    rows: gridRows,
    collapsible: true,
    content: {
      type: "view",
      toolId: config.contextSidebarToolId,
      docUrl: accountDocUrl,
    },
  };

  return {
    items: [sidebar, center, context],
    pipes: [],
  };
}
