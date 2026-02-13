import type {
  HistoryChange,
  HistoryItem,
  GroupingStrategyConfig,
} from "../types";
import { isHistoryGroup } from "../types";
import {
  DEFAULT_TIME_WINDOW,
  createGroup,
  groupByAuthor,
  groupByTimeWindow,
} from "./strategies";

/**
 * Result of computing incremental groups
 */
export interface IncrementalGroupResult {
  /** Whether the first new group should merge with the last existing item */
  shouldMergeWithLast: boolean;
  /** New groups to add (first one may merge with last existing) */
  newGroups: HistoryItem[];
}

/**
 * Computes what new groups should be added based only on the last item.
 * This is O(k) where k = number of new changes, regardless of total history size.
 *
 * OPTIMIZATION: This function only needs to read the LAST item from the existing history,
 * not the full array. This makes incremental updates O(1) read + O(k) compute instead of O(n).
 *
 * @param lastItem - The last item in the existing grouped history (or undefined if empty)
 * @param newChanges - New changes to process (ordered newest first)
 * @param config - Grouping strategy configuration
 * @returns Object with shouldMergeWithLast flag and array of new groups
 */
export function computeIncrementalGroups(
  lastItem: HistoryItem | undefined,
  newChanges: HistoryChange[],
  config: GroupingStrategyConfig
): IncrementalGroupResult {
  if (newChanges.length === 0) {
    return { shouldMergeWithLast: false, newGroups: [] };
  }

  // Dispatch to strategy-specific implementation
  switch (config.name) {
    case "none":
      return computeIncrementalNone(lastItem, newChanges);
    case "timeWindow":
      return computeIncrementalTimeWindow(lastItem, newChanges, config);
    case "author":
      return computeIncrementalAuthor(lastItem, newChanges);
    default:
      const exhaustiveCheck: never = config.name;
      throw new Error(`Unknown strategy: ${exhaustiveCheck}`);
  }
}

/**
 * Incremental grouping for "none" strategy
 * No grouping - just return changes as-is, never merge
 */
function computeIncrementalNone(
  lastItem: HistoryItem | undefined,
  newChanges: HistoryChange[]
): IncrementalGroupResult {
  // "none" strategy means no grouping - each change is its own item
  return {
    shouldMergeWithLast: false,
    newGroups: newChanges,
  };
}

/**
 * Incremental grouping for "timeWindow" strategy
 * Groups changes within a time window
 */
function computeIncrementalTimeWindow(
  lastItem: HistoryItem | undefined,
  newChanges: HistoryChange[],
  config: GroupingStrategyConfig
): IncrementalGroupResult {
  const windowMs = config.params?.timeWindow ?? DEFAULT_TIME_WINDOW;

  if (!lastItem) {
    // No existing items - group the new changes among themselves
    const newGroups = groupByTimeWindow(windowMs)(newChanges);
    return { shouldMergeWithLast: false, newGroups };
  }

  // Get time of the last existing item
  const lastItemTime = getItemEndTime(lastItem);

  // Get time of the newest new change (first in array since newest first)
  const newestNewChange = newChanges[0];
  const newestNewTime = newestNewChange.metadata?.time
    ? newestNewChange.metadata.time * 1000
    : 0;

  // Check if newest new change is within window of last item
  const timeDiff = Math.abs(newestNewTime - lastItemTime);

  if (timeDiff <= windowMs) {
    // Can merge with last item
    // Find all new changes that can merge with the last item
    const { mergeable, rest } = splitChangesByTimeWindow(
      newChanges,
      lastItemTime,
      windowMs
    );

    // Group the remaining changes among themselves
    const restGroups = rest.length > 0 ? groupByTimeWindow(windowMs)(rest) : [];

    // Return mergeable changes as first group (to merge with last)
    // and rest as additional groups
    if (mergeable.length > 0) {
      return {
        shouldMergeWithLast: true,
        newGroups: [
          mergeable.length === 1 ? mergeable[0] : createGroup(mergeable),
          ...restGroups,
        ],
      };
    } else {
      return {
        shouldMergeWithLast: false,
        newGroups: restGroups,
      };
    }
  } else {
    // Cannot merge with last item - group new changes among themselves
    const newGroups = groupByTimeWindow(windowMs)(newChanges);
    return { shouldMergeWithLast: false, newGroups };
  }
}

/**
 * Incremental grouping for "author" strategy
 * Groups consecutive changes by the same author
 */
function computeIncrementalAuthor(
  lastItem: HistoryItem | undefined,
  newChanges: HistoryChange[]
): IncrementalGroupResult {
  if (!lastItem) {
    // No existing items - group the new changes among themselves
    const newGroups = groupByAuthor(newChanges);
    return { shouldMergeWithLast: false, newGroups };
  }

  // Get author of the last existing item
  const lastItemAuthor = getItemAuthor(lastItem);

  // Find all new changes that have the same author as the last item
  const { sameAuthor, differentAuthor } = splitChangesByAuthor(
    newChanges,
    lastItemAuthor
  );

  // Group the different author changes among themselves
  const differentGroups =
    differentAuthor.length > 0 ? groupByAuthor(differentAuthor) : [];

  // If we have changes with the same author, they merge with the last item
  if (sameAuthor.length > 0) {
    return {
      shouldMergeWithLast: true,
      newGroups: [
        sameAuthor.length === 1 ? sameAuthor[0] : createGroup(sameAuthor),
        ...differentGroups,
      ],
    };
  } else {
    return {
      shouldMergeWithLast: false,
      newGroups: differentGroups,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the end time (newest time) of a history item
 */
function getItemEndTime(item: HistoryItem): number {
  if (isHistoryGroup(item)) {
    return item.endTime ? item.endTime * 1000 : 0;
  } else {
    return item.metadata?.time ? item.metadata.time * 1000 : 0;
  }
}

/**
 * Get the author of a history item
 */
function getItemAuthor(item: HistoryItem): string | undefined {
  if (isHistoryGroup(item)) {
    return item.changes[0]?.metadata?.actor;
  } else {
    return item.metadata?.actor;
  }
}

/**
 * Split changes into those that are within the time window and those that aren't
 */
function splitChangesByTimeWindow(
  changes: HistoryChange[],
  referenceTime: number,
  windowMs: number
): { mergeable: HistoryChange[]; rest: HistoryChange[] } {
  const mergeable: HistoryChange[] = [];
  const rest: HistoryChange[] = [];

  for (const change of changes) {
    const changeTime = change.metadata?.time ? change.metadata.time * 1000 : 0;
    const timeDiff = Math.abs(changeTime - referenceTime);

    if (timeDiff <= windowMs) {
      mergeable.push(change);
    } else {
      rest.push(change);
    }
  }

  return { mergeable, rest };
}

/**
 * Split changes by author - those matching and those not matching
 */
function splitChangesByAuthor(
  changes: HistoryChange[],
  targetAuthor: string | undefined
): { sameAuthor: HistoryChange[]; differentAuthor: HistoryChange[] } {
  // Handle case where we're looking at the beginning (no author to match)
  if (targetAuthor === undefined) {
    return { sameAuthor: [], differentAuthor: changes };
  }

  const sameAuthor: HistoryChange[] = [];
  const differentAuthor: HistoryChange[] = [];

  // Changes are newest first - we want to group consecutive same-author changes
  // starting from the newest
  for (const change of changes) {
    const author = change.metadata?.actor;

    if (author === targetAuthor) {
      sameAuthor.push(change);
    } else {
      // Different author - stop consecutive matching
      break;
    }
  }

  // All remaining changes after the consecutive same-author run
  if (sameAuthor.length < changes.length) {
    differentAuthor.push(...changes.slice(sameAuthor.length));
  }

  return { sameAuthor, differentAuthor };
}
