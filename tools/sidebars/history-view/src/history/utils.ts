import type { GroupingStrategyConfig } from "../types";
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

export const DEFAULT_TIME_WINDOW = 30 * 60 * 1000; // 30 minutes

/**
 * Generate a unique cache key for a grouping strategy configuration.
 *
 * Format:
 * - "author" - Group by author
 * - "timeWindow:1800000" - Time window grouping with specific window in ms
 *
 * The key is used to store and retrieve cached groupings from the groupings
 * document. Each unique combination of strategy name and parameters gets its
 * own cache entry.
 *
 * NOTE: Keep in sync with the duplicate implementation in `./task.ts` — the
 * task module can't currently import from siblings when run under the shared
 * worker.
 */
export function getStrategyKey(config: GroupingStrategyConfig): string {
  switch (config.name) {
    case "author":
      return "author";
    case "timeWindow": {
      const windowMs = config.params?.timeWindow ?? DEFAULT_TIME_WINDOW;
      return `timeWindow:${windowMs}`;
    }
    default:
      throw new Error(`Unknown strategy: ${(config as { name: string }).name}`);
  }
}
