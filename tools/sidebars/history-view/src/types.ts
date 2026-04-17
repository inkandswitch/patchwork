import type { AutomergeUrl } from "@automerge/automerge-repo/slim";

/**
 * Represents a single change in the document history.
 *
 * This is a deliberately minimal projection of Automerge's `ChangeMetadata`:
 * the UI only needs hash/actor/time, and `beforeHead` for diff selection.
 * Other fields (seq, startOp, maxOp, message, deps) are intentionally omitted
 * to keep the cached history document small.
 */
export interface HistoryChange {
  hash: string;
  actor: string;
  time: number;
  beforeHead?: string;
}

/**
 * Represents a group of related changes.
 *
 * Intermediate changes within the group are not stored — only the aggregate
 * information the UI actually reads. This keeps the cached history document
 * compact even for source documents with very long histories.
 */
export interface HistoryGroup {
  id: string;
  /** Number of changes in the group */
  count: number;
  /** Hash of the newest change in the group (used for selection and copy) */
  latestHash: string;
  /** Deduplicated list of authors across all changes in the group */
  authors: string[];
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
  return "latestHash" in item;
}

/**
 * Type guard to check if an item is a HistoryChange
 */
export function isHistoryChange(item: HistoryItem): item is HistoryChange {
  return "hash" in item && !("latestHash" in item);
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
/**
 * Schema version for the cached history document.
 * Bump when the shape of HistoryChange / HistoryGroup changes so the task
 * can discard a stale cache instead of reading a now-incompatible structure.
 */
export const HISTORY_DOC_VERSION = 2;

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
 * Find an item (change or group) matching a specific hash.
 *
 * Note: for groups, only the group's latest/representative hash is matched,
 * since the selection UI only ever produces that hash — intermediate change
 * hashes inside a group are never looked up here.
 */
export function findItemByHash(
  items: HistoryItem[],
  hash: string
): HistoryItem | null {
  for (const item of items) {
    if (isHistoryChange(item) && item.hash === hash) {
      return item;
    } else if (isHistoryGroup(item) && item.latestHash === hash) {
      return item;
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
    // Highlight group if selected change is its representative (latest) change
    return item.latestHash === selectedItem.hash;
  }
  return false;
}
