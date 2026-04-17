import type { AutomergeUrl } from "@automerge/automerge-repo/slim";

/**
 * Represents a run of one-or-more changes in the document history.
 *
 * A "singleton" change is simply a `HistoryItem` with `count === 1`; the
 * storage and render paths do not distinguish it from a multi-change group.
 *
 * Intermediate per-change metadata is not kept here — only the aggregate
 * information the UI reads. Per-change `actor` / `time` fields live on the
 * source document itself and are not duplicated into this cache.
 */
export interface HistoryItem {
  id: string;
  /** Number of changes covered by this item (1 for a lone change) */
  count: number;
  /** Hash of the newest change in the item (used for selection and copy) */
  latestHash: string;
  /** Deduplicated list of authors across all changes in the item */
  authors: string[];
  /** Start time in Unix seconds (from Automerge ChangeMetadata.time) */
  startTime?: number;
  /** End time in Unix seconds (from Automerge ChangeMetadata.time) */
  endTime?: number;
  /** Hash of the change immediately preceding this item in linear history */
  beforeHead?: string;
}

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
 * Schema version for the cached history document.
 * Bump when the shape of `HistoryItem` changes so the task can discard a
 * stale cache instead of reading a now-incompatible structure.
 */
export const HISTORY_DOC_VERSION = 3;

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
 * Find an item matching a specific hash.
 *
 * Only the item's latest/representative hash is matched, since the selection
 * UI only ever produces that hash — intermediate change hashes inside a
 * multi-change item are never looked up here.
 */
export function findItemByHash(
  items: HistoryItem[],
  hash: string
): HistoryItem | null {
  for (const item of items) {
    if (item.latestHash === hash) return item;
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
  return item.id === selectedItem.id;
}
