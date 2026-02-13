import type { ChangeMetadata } from "@automerge/automerge";
import type { AutomergeUrl } from "@automerge/automerge-repo/slim";

/**
 * Represents a single change in the document history
 */
export interface HistoryChange {
  hash: string;
  metadata: ChangeMetadata;
  beforeHead?: string;
}

/**
 * Represents a group of related changes
 */
export interface HistoryGroup {
  id: string;
  changes: HistoryChange[];
  // Can include aggregate metadata in the future
  startTime?: number;
  endTime?: number;
  beforeHead?: string;
}

/**
 * Union type for items in the history list
 * Can be either a single change or a group of changes
 */
export type HistoryItem = HistoryChange | HistoryGroup;

/**
 * Type guard to check if an item is a HistoryGroup
 */
export function isHistoryGroup(item: HistoryItem): item is HistoryGroup {
  return "changes" in item;
}

/**
 * Type guard to check if an item is a HistoryChange
 */
export function isHistoryChange(item: HistoryItem): item is HistoryChange {
  return "hash" in item && !("changes" in item);
}

/**
 * Function type for grouping strategies
 * Takes a flat list of changes and returns grouped items
 */
export type GroupingStrategy = (changes: HistoryChange[]) => HistoryItem[];

/**
 * ViewHeads structure for annotations
 */
export interface ViewHeadsType {
  beforeHeads: string[];
  afterHeads: string[];
}

/**
 * Configuration for a grouping strategy including parameters
 */
export interface GroupingStrategyConfig {
  name: "none" | "timeWindow" | "author";
  params?: {
    timeWindow?: number; // in milliseconds
  };
}

/**
 * Cached grouping with staleness tracking
 */
export interface CachedGrouping {
  heads: string[];
  items: HistoryItem[];
}

/**
 * Document structure for storing persistent history groupings
 */
export interface HistoryGroupingsDoc {
  ["@patchwork"]: { type: "patchwork:history-change-groups" };
  version: number;
  sourceDocumentUrl: AutomergeUrl;
  groupings: {
    [strategyKey: string]: CachedGrouping;
  };
}

/**
 * Find an item (change or group) that contains a specific hash
 */
export function findItemByHash(
  items: HistoryItem[],
  hash: string
): HistoryItem | null {
  for (const item of items) {
    if (isHistoryChange(item) && item.hash === hash) {
      return item;
    } else if (isHistoryGroup(item)) {
      if (item.changes.some((c) => c.hash === hash)) {
        return item;
      }
    }
  }
  return null;
}

/**
 * Check if an item is currently selected
 */
export function isItemSelected(
  item: HistoryItem,
  selectedItem: HistoryItem | null
): boolean {
  if (!selectedItem) return false;

  if (isHistoryChange(item) && isHistoryChange(selectedItem)) {
    return item.hash === selectedItem.hash;
  } else if (isHistoryGroup(item) && isHistoryGroup(selectedItem)) {
    return item.id === selectedItem.id;
  } else if (isHistoryGroup(item) && isHistoryChange(selectedItem)) {
    // Highlight group if selected change is within it
    return item.changes.some((c) => c.hash === selectedItem.hash);
  }
  return false;
}
