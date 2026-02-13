import type {
  HistoryChange,
  HistoryItem,
  HistoryGroup,
  GroupingStrategyConfig,
} from "../types";

/**
 * Default strategy: no grouping, returns changes as-is
 */
export function noGrouping(changes: HistoryChange[]): HistoryItem[] {
  return changes;
}

/**
 * Group changes that occur within a specified time window (in milliseconds)
 * Changes within the window are grouped together
 */
export function groupByTimeWindow(
  windowMs: number
): (changes: HistoryChange[]) => HistoryItem[] {
  return (changes: HistoryChange[]): HistoryItem[] => {
    if (changes.length === 0) return [];

    const groups: HistoryItem[] = [];
    let currentGroup: HistoryChange[] = [];

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      const changeTime = change.metadata?.time
        ? change.metadata.time * 1000
        : 0;

      if (currentGroup.length === 0) {
        // Start a new group
        currentGroup.push(change);
      } else {
        // Check if this change is within the time window of the first change in the group
        const groupStartTime = currentGroup[0].metadata?.time
          ? currentGroup[0].metadata.time * 1000
          : 0;
        const timeDiff = Math.abs(groupStartTime - changeTime);

        if (timeDiff <= windowMs) {
          // Add to current group
          currentGroup.push(change);
        } else {
          // Save current group and start a new one
          if (currentGroup.length === 1) {
            // Single item, don't create a group
            groups.push(currentGroup[0]);
          } else {
            // Multiple items, create a group
            groups.push(createGroup(currentGroup));
          }
          currentGroup = [change];
        }
      }
    }

    // Add the last group
    if (currentGroup.length === 1) {
      groups.push(currentGroup[0]);
    } else if (currentGroup.length > 1) {
      groups.push(createGroup(currentGroup));
    }

    return groups;
  };
}

/**
 * Group consecutive changes by the same author
 */
export function groupByAuthor(changes: HistoryChange[]): HistoryItem[] {
  if (changes.length === 0) return [];

  const groups: HistoryItem[] = [];
  let currentGroup: HistoryChange[] = [];
  let currentAuthor: string | undefined;

  for (const change of changes) {
    const author = change.metadata?.actor;

    if (currentGroup.length === 0 || author === currentAuthor) {
      // Same author or starting a new group
      currentGroup.push(change);
      currentAuthor = author;
    } else {
      // Different author, save current group and start new one
      if (currentGroup.length === 1) {
        groups.push(currentGroup[0]);
      } else {
        groups.push(createGroup(currentGroup));
      }
      currentGroup = [change];
      currentAuthor = author;
    }
  }

  // Add the last group
  if (currentGroup.length === 1) {
    groups.push(currentGroup[0]);
  } else if (currentGroup.length > 1) {
    groups.push(createGroup(currentGroup));
  }

  return groups;
}

/**
 * Helper function to create a HistoryGroup from an array of changes
 */
export function createGroup(changes: HistoryChange[]): HistoryGroup {
  const group: HistoryGroup = {
    id: `group-${changes[0].hash}-${changes.length}`,
    changes,
  };

  let minTime = Infinity;
  let maxTime = -Infinity;
  for (const c of changes) {
    const t = c.metadata?.time;
    if (t !== undefined) {
      if (t < minTime) minTime = t;
      if (t > maxTime) maxTime = t;
    }
  }
  if (minTime !== Infinity) {
    group.startTime = minTime;
    group.endTime = maxTime;
  }

  const lastBeforeHead = changes[changes.length - 1].beforeHead;
  if (lastBeforeHead) {
    group.beforeHead = lastBeforeHead;
  }

  return group;
}

/**
 * Standard time window options for grouping
 */
export const TIME_WINDOW_OPTIONS = {
  "30m": 30 * 60 * 1000, // 30 minutes (default)
  "4h": 4 * 60 * 60 * 1000, // 4 hours
  "1d": 24 * 60 * 60 * 1000, // 1 day
  "1w": 7 * 24 * 60 * 60 * 1000, // 1 week
} as const;

export const DEFAULT_TIME_WINDOW = TIME_WINDOW_OPTIONS["30m"];

/**
 * Generate a unique cache key for a grouping strategy configuration
 *
 * Format:
 * - "none" - No grouping
 * - "author" - Group by author
 * - "timeWindow:300000" - Time window grouping with specific window in ms
 *
 * The key is used to store and retrieve cached groupings from the groupings document.
 * Each unique combination of strategy name and parameters gets its own cache entry.
 */
export function getStrategyKey(config: GroupingStrategyConfig): string {
  switch (config.name) {
    case "none":
      return "none";
    case "author":
      return "author";
    case "timeWindow": {
      const windowMs = config.params?.timeWindow ?? DEFAULT_TIME_WINDOW;
      return `timeWindow:${windowMs}`;
    }
    default:
      throw new Error(`Unknown strategy: ${config.name}`);
  }
}

/**
 * Apply a grouping strategy configuration to a list of changes
 */
export function applyGroupingStrategy(
  config: GroupingStrategyConfig,
  changes: HistoryChange[]
): HistoryItem[] {
  switch (config.name) {
    case "none":
      return noGrouping(changes);
    case "author":
      return groupByAuthor(changes);
    case "timeWindow": {
      const windowMs = config.params?.timeWindow ?? DEFAULT_TIME_WINDOW;
      return groupByTimeWindow(windowMs)(changes);
    }
    default:
      throw new Error(`Unknown strategy: ${config.name}`);
  }
}
