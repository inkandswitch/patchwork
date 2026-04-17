import type { AutomergeUrl } from "@automerge/automerge-repo";
// TODO: relative imports aren't working correctly when the task runs in the shared worker
// import { getStrategyKey, DEFAULT_TIME_WINDOW } from "./utils";
import { Automerge } from "@automerge/automerge-repo/slim";
import type { HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import type {
  HistoryChange,
  HistoryGroupingsDoc,
  HistoryItem,
  StrategyName,
  HistoryGroup,
  GroupingStrategyConfig,
} from "../types";
import { ChangeMetadata } from "@automerge/automerge";

const THROTTLE_MS = 30 * 1000; // 30 second throttle for task re-runs on the same document

// TODO: relative imports aren't working correctly when the task runs in the shared worker
// Keep this in sync with `HISTORY_DOC_VERSION` in ../types.ts
const HISTORY_DOC_VERSION = 2;

/**
 * Background task that computes full history groupings for a source document.
 * Handles get-or-create of the history groupings document, then computes
 * author and time-window groupings and writes results.
 */
export default async function (source: AutomergeUrl) {
  const now = Date.now();
  const sourceDocHandle = await repo.find<HasPatchworkMetadata>(source);
  const sourceDoc = sourceDocHandle.doc();
  if (!sourceDoc) {
    console.warn("History task: source document not available");
    return;
  }

  // Get or create the history document for this source document
  const historyUrl = sourceDoc["@patchwork"]?.history;
  let historyDocHandle = historyUrl
    ? await repo.find<HistoryGroupingsDoc>(historyUrl)
    : undefined;

  if (!historyDocHandle) {
    // create the history document
    historyDocHandle = await repo.create2<
      HistoryGroupingsDoc & HasPatchworkMetadata
    >({
      ["@patchwork"]: { type: "patchwork:history-change-groups" },
      sourceDocumentUrl: sourceDocHandle.url,
      throttleMs: THROTTLE_MS,
      updatedAt: now,
      version: HISTORY_DOC_VERSION,
      heads: [],
      groupings: {},
    });
    // Update source document with reference to history document
    sourceDocHandle.change((doc) => {
      if (!doc["@patchwork"]) {
        console.warn(
          "History task: source document missing @patchwork metadata"
        );
        return;
      }
      doc["@patchwork"].history = historyDocHandle!.url;
    });
  } else {
    const histDoc = historyDocHandle.doc();
    if (!histDoc) {
      console.warn("History task: history document not available");
      return;
    }

    const storedVersion = histDoc.version ?? 0;
    if (storedVersion < HISTORY_DOC_VERSION) {
      // Stale cache from an older schema — reset it so we recompute below.
      historyDocHandle.change((doc: HistoryGroupingsDoc) => {
        doc.version = HISTORY_DOC_VERSION;
        doc.heads = [];
        doc.groupings = {};
        doc.updatedAt = now;
      });
    } else {
      // Check throttle before computing to avoid duplicate tasks
      const lastUpdate = histDoc.updatedAt ?? 0;
      const throttleMs = histDoc.throttleMs ?? THROTTLE_MS;
      if (now - lastUpdate < throttleMs) return;

      // Mark that a task is running — write timestamp before computation to avoid duplicate tasks
      historyDocHandle.change((doc: HistoryGroupingsDoc) => {
        doc.updatedAt = now;
      });
    }
  }

  // Get all metadata for all changes since the beginning
  const allMeta = Automerge.getChangesMetaSince(sourceDoc, []);
  const currentHeads = Automerge.getHeads(sourceDoc);

  // Reverse to get newest first (UI display order)
  allMeta.reverse();

  // Convert to history changes
  const historyChanges = changeMetadataToHistoryChanges(allMeta);

  // Apply all grouping strategies to get grouped items for each strategy
  // TODO: it would be good to have some way to manage the set of strategies to apply

  const timeConfig = {
    name: "timeWindow" as StrategyName,
    params: { timeWindow: DEFAULT_TIME_WINDOW },
  };
  const timeGrouping = applyGroupingStrategy(timeConfig, historyChanges);
  // TODO: this was an experimental stand-in for author grouping, but we can't really implement it until we have proper author data (e.g. via Keyhive)
  // const authorGrouping = groupByAuthor(historyChanges);

  // Write to history doc
  historyDocHandle.change((doc: HistoryGroupingsDoc) => {
    doc.heads = currentHeads;
    // doc.groupings["author"] = {
    //   items: authorGrouping as HistoryItem[],
    // };
    doc.groupings[getStrategyKey(timeConfig)] = {
      items: timeGrouping as HistoryItem[],
    };
  });
}

/**
 * Convert Automerge change metadata (ordered newest-first) to a compact
 * `HistoryChange[]` that only carries the fields the UI actually uses.
 *
 * We deliberately drop `seq`, `startOp`, `maxOp`, `message`, and `deps` — the
 * last of which is an array of dependency hashes per change and is the single
 * largest contributor to history-doc bloat.
 *
 * `beforeHead` links each item to the hash of the next (older) change, which
 * selection logic uses as `beforeHeads` when diffing a single change. It's
 * still attached here for convenience; for changes that later get folded into
 * a group, the field is discarded when building the group.
 */
function changeMetadataToHistoryChanges(
  metadata: ChangeMetadata[]
): HistoryChange[] {
  return metadata.map((meta, index) => {
    const change: HistoryChange = {
      hash: meta.hash,
      actor: meta.actor,
      time: meta.time,
    };
    const beforeHead = metadata[index + 1]?.hash;
    if (beforeHead) {
      change.beforeHead = beforeHead;
    }
    return change;
  });
}

// ============================================================================
// Strategies
// ============================================================================

/**
 * TODO: this is redefined because relative imports aren't working correctly when the task runs
 * Standard time window options for grouping
 */
export const TIME_WINDOW_OPTIONS = {
  "30m": 30 * 60 * 1000, // 30 minutes (default)
} as const;

export const DEFAULT_TIME_WINDOW = TIME_WINDOW_OPTIONS["30m"];

/**
 * TODO: this is redefined because relative imports aren't working correctly when the task runs
 * Generate a unique cache key for a grouping strategy configuration
 *
 * Format:
 * - "author" - Group by author
 * - "timeWindow:300000" - Time window grouping with specific window in ms
 *
 * The key is used to store and retrieve cached groupings from the groupings document.
 * Each unique combination of strategy name and parameters gets its own cache entry.
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
      throw new Error(`Unknown strategy: ${config.name}`);
  }
}

/**
 * Group changes that occur within a specified time window (in milliseconds)
 * Changes within the window are grouped together
 */
function groupByTimeWindow(
  windowMs: number
): (changes: HistoryChange[]) => HistoryItem[] {
  return (changes: HistoryChange[]): HistoryItem[] => {
    if (changes.length === 0) return [];

    const groups: HistoryItem[] = [];
    let currentGroup: HistoryChange[] = [];

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      const changeTime = change.time ? change.time * 1000 : 0;

      if (currentGroup.length === 0) {
        // Start a new group
        currentGroup.push(change);
      } else {
        // Check if this change is within the time window of the first change in the group
        const groupStartTime = currentGroup[0].time
          ? currentGroup[0].time * 1000
          : 0;
        const timeDiff = Math.abs(groupStartTime - changeTime);

        if (timeDiff <= windowMs) {
          // Add to current group
          currentGroup.push(change);
        } else {
          // Save current group and start a new one
          finalizeGroup(groups, currentGroup);
          currentGroup = [change];
        }
      }
    }

    // Add the last group
    finalizeGroup(groups, currentGroup);

    return groups;
  };
}

/**
 * Group consecutive changes by the same author
 */
function groupByAuthor(changes: HistoryChange[]): HistoryItem[] {
  if (changes.length === 0) return [];

  const groups: HistoryItem[] = [];
  let currentGroup: HistoryChange[] = [];
  let currentAuthor: string | undefined;

  for (const change of changes) {
    const author = change.actor;

    if (currentGroup.length === 0 || author === currentAuthor) {
      // Same author or starting a new group
      currentGroup.push(change);
      currentAuthor = author;
    } else {
      // Different author, save current group and start new one
      finalizeGroup(groups, currentGroup);
      currentGroup = [change];
      currentAuthor = author;
    }
  }

  // Add the last group
  finalizeGroup(groups, currentGroup);

  return groups;
}

/**
 * Build a compact `HistoryGroup` from an array of changes.
 *
 * Intermediate per-change data is aggregated and dropped; only the fields the
 * UI reads (count, latestHash, authors, start/end time, beforeHead) are kept.
 * This is the main reason a grouped history doc stays small even for source
 * documents with very long histories.
 */
function createGroup(changes: HistoryChange[]): HistoryGroup {
  const authors: string[] = [];
  let minTime = Infinity;
  let maxTime = -Infinity;
  for (const c of changes) {
    if (c.actor && !authors.includes(c.actor)) authors.push(c.actor);
    const t = c.time;
    if (t !== undefined) {
      if (t < minTime) minTime = t;
      if (t > maxTime) maxTime = t;
    }
  }

  const group: HistoryGroup = {
    id: `group-${changes[0].hash}-${changes.length}`,
    count: changes.length,
    latestHash: changes[0].hash,
    authors,
  };

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
 * Push a completed group to the output array.
 * Single changes are kept as-is; multiple changes are wrapped in a HistoryGroup.
 */
function finalizeGroup(
  groups: HistoryItem[],
  currentGroup: HistoryChange[]
): void {
  if (currentGroup.length === 1) {
    groups.push(currentGroup[0]);
  } else if (currentGroup.length > 1) {
    groups.push(createGroup(currentGroup));
  }
}

/**
 * Apply a grouping strategy configuration to a list of changes
 */
function applyGroupingStrategy(
  config: GroupingStrategyConfig,
  changes: HistoryChange[]
): HistoryItem[] {
  switch (config.name) {
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
