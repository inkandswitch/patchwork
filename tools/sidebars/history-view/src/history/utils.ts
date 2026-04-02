import type {
  GroupingStrategyConfig,
  HistoryGroup,
  StoredChangeEntry,
} from "../types";
import { relativeTime } from "@patchwork/util/src/relative-time";

/**
 * Format a Unix timestamp (in seconds) to a display string.
 * Returns e.g. "Jan 5, 2:30 PM (3 hours ago)" or "" if no timestamp.
 */
export function formatTime(timestampSeconds: number | undefined): string {
  if (!timestampSeconds) return "";

  const date = new Date(timestampSeconds * 1000);
  const datePart = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const relative = relativeTime(timestampSeconds * 1000);

  return `${datePart}, ${timePart} (${relative})`;
}

// ============================================================================
// Strategies
// ============================================================================

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
 * Apply a grouping strategy to minute-keyed groupings, producing display-ready HistoryGroup[].
 */
export function applyGroupingStrategy(
  config: GroupingStrategyConfig,
  groupings: { [minuteTimestamp: string]: StoredChangeEntry[] } | undefined
): HistoryGroup[] {
  if (!groupings) return [];

  switch (config.name) {
    case "author":
      // TODO: implement author grouping on minute buckets
      // For now, fall back to time window with default window
      return groupByTimeWindow(DEFAULT_TIME_WINDOW, groupings);
    case "timeWindow": {
      const windowMs = config.params?.timeWindow ?? DEFAULT_TIME_WINDOW;
      return groupByTimeWindow(windowMs, groupings);
    }
    default:
      throw new Error(`Unknown strategy: ${config.name}`);
  }
}

interface MinuteBucket {
  minuteTimestamp: number;
  entries: StoredChangeEntry[];
}

/**
 * Group changes by time window operating directly on minute buckets.
 * Minute buckets are processed newest-first, while entries within a
 * bucket remain in their stored oldest-first order.
 */
function groupByTimeWindow(
  windowMs: number,
  groupings: { [minuteTimestamp: string]: StoredChangeEntry[] }
): HistoryGroup[] {
  const minuteBuckets = Object.entries(groupings)
    .map(([minuteTimestamp, entries]) => ({
      minuteTimestamp: Number(minuteTimestamp),
      entries,
    }))
    .sort((a, b) => b.minuteTimestamp - a.minuteTimestamp);

  if (minuteBuckets.length === 0) return [];

  const groups: HistoryGroup[] = [];
  let currentBuckets: MinuteBucket[] = [];
  let newestMinuteInGroupMs = 0;

  for (const bucket of minuteBuckets) {
    const bucketMinuteMs = bucket.minuteTimestamp * 1000;

    if (currentBuckets.length === 0) {
      currentBuckets.push(bucket);
      newestMinuteInGroupMs = bucketMinuteMs;
    } else {
      const timeDiff = Math.abs(newestMinuteInGroupMs - bucketMinuteMs);

      if (timeDiff <= windowMs) {
        currentBuckets.push(bucket);
      } else {
        groups.push(buildGroupFromBuckets(currentBuckets));
        currentBuckets = [bucket];
        newestMinuteInGroupMs = bucketMinuteMs;
      }
    }
  }

  if (currentBuckets.length > 0) {
    groups.push(buildGroupFromBuckets(currentBuckets));
  }

  // Link beforeHead: each group's beforeHead = next group's afterHead
  for (let i = 0; i < groups.length - 1; i++) {
    groups[i].beforeHead = groups[i + 1].afterHead;
  }

  return groups;
}

/**
 * Build a HistoryGroup from minute buckets ordered newest-first.
 * Entries inside each bucket are stored oldest-first.
 */
function buildGroupFromBuckets(buckets: MinuteBucket[]): HistoryGroup {
  const newestBucket = buckets[0];
  const afterHead = newestBucket.entries[newestBucket.entries.length - 1]?.head;

  if (!afterHead) {
    throw new Error("Cannot build history group from an empty minute bucket");
  }

  const actorSet = new Set<string>();
  const messages: string[] = [];
  let minTime = Infinity;
  let maxTime = -Infinity;
  let changeCount = 0;

  // Preserve chronological order for per-entry summary fields.
  for (let bucketIndex = buckets.length - 1; bucketIndex >= 0; bucketIndex--) {
    const bucket = buckets[bucketIndex];

    for (const entry of bucket.entries) {
      actorSet.add(entry.actor);
      changeCount += 1;

      if (entry.message) {
        messages.push(entry.message);
      }

      if (entry.time < minTime) minTime = entry.time;
      if (entry.time > maxTime) maxTime = entry.time;
    }
  }

  return {
    id: `group-${afterHead}-${changeCount}`,
    afterHead,
    actors: Array.from(actorSet),
    changeCount,
    messages,
    startTime: minTime !== Infinity ? minTime : undefined,
    endTime: maxTime !== -Infinity ? maxTime : undefined,
  };
}
