import type { ChangeMetadata } from "@automerge/automerge";
import type { AutomergeUrl } from "@automerge/automerge-repo/slim";

/**
 * Represents a single change in the document history
 */
export interface HistoryChange extends ChangeMetadata {
  beforeHead?: string;
}

/**
 * Represents a group of related changes
 */
export interface HistoryGroup {
  id: string;
  changes: HistoryChange[];
  /** Start time of the group in Unix seconds (from Automerge ChangeMetadata.time) */
  startTime?: number;
  /** End time of the group in Unix seconds (from Automerge ChangeMetadata.time) */
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
export type StrategyName = "none" | "timeWindow" | "author";
export interface GroupingStrategyConfig {
  name: StrategyName;
  params?: {
    timeWindow?: number; // in milliseconds
  };
}

/**
 * Cached grouping for a single strategy
 */
export interface CachedGrouping {
  items: HistoryItem[];
}

/**
 * Document structure for storing persistent history groupings.
 * `heads` is stored at the top level because the background task
 * computes all strategies in a single pass.
 */
export interface HistoryGroupingsDoc {
  ["@patchwork"]: { type: "patchwork:history-change-groups" };
  version: number;
  sourceDocumentUrl: AutomergeUrl;
  /** Unix ms timestamp of when the task last ran (set at task start) */
  updatedAt: number;
  /** Throttle interval in ms — minimum wait before dispatching another task */
  throttleMs: number;
  heads: string[];
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
