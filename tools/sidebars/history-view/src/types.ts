import type { AutomergeUrl } from "@automerge/automerge-repo/slim";

export type TinyPatchworkAccountDoc = {
  ["__taskQueues__"]?: {
    [queueUrl: AutomergeUrl]: boolean;
  };
  rootFolderUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;
};

/**
 * Represents a group of related changes — display-only summary data.
 */
export interface HistoryGroup {
  id: string;
  beforeHead?: string; // hash before this group (for diff: "before" state)
  afterHead: string; // hash of newest change in group (for diff: "after" state)
  startTime?: number; // Unix seconds, earliest change
  endTime?: number; // Unix seconds, latest change
  actors: string[]; // unique actor IDs in the group
  changeCount: number; // total number of changes
  messages: string[]; // ordered array of non-null messages
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
export type StrategyName = "timeWindow" | "author";
export interface GroupingStrategyConfig {
  name: StrategyName;
  params?: {
    timeWindow?: number; // in milliseconds
  };
}

/**
 * A single stored change entry — minimal data stored in the history document.
 */
export interface StoredChangeEntry {
  head: string; // Automerge change hash
  message: string | null;
  time: number; // Unix seconds (from Automerge ChangeMetadata.time)
  actor: string; // Automerge actor ID
}

/**
 * Document structure for storing persistent history data.
 * Changes are stored in 1-minute increments keyed by the Unix seconds
 * timestamp at the start of each minute. Each minute bucket is an array
 * of entries ordered oldest-first following Automerge metadata order.
 * Grouping strategies are computed on the frontend.
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
    [minuteTimestamp: string]: StoredChangeEntry[];
  };
}

/**
 * Check if an item is currently selected
 */
export function isItemSelected(
  item: HistoryGroup,
  selectedItem: HistoryGroup | null
): boolean {
  if (!selectedItem) return false;
  return item.id === selectedItem.id;
}
