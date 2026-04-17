import type { AutomergeUrl } from "@automerge/automerge-repo";
// TODO: relative imports aren't working correctly when the task runs in the shared worker
// import { getStrategyKey, DEFAULT_TIME_WINDOW } from "./utils";
import { Automerge } from "@automerge/automerge-repo/slim";
import type { HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import type {
  HistoryGroupingsDoc,
  HistoryItem,
  GroupingStrategyConfig,
} from "../types";
import { ChangeMetadata } from "@automerge/automerge";

// Safety-net throttle: prevents thrashing the history doc if something keeps
// re-enqueuing this task faster than it can complete. The primary dispatch
// gate lives in the `useCachedHistory` hook, which only dispatches at natural
// group boundaries, so this value can stay short.
const THROTTLE_MS = 2 * 1000;

// TODO: relative imports aren't working correctly when the task runs in the shared worker
// Keep this in sync with `HISTORY_DOC_VERSION` in ../types.ts
const HISTORY_DOC_VERSION = 3;

/**
 * Internal working shape used while walking the source doc's change stream.
 * Never stored in the cache; the final cached form is `HistoryItem` with
 * aggregated fields only.
 */
interface WorkingChange {
  hash: string;
  actor: string;
  time: number;
  beforeHead?: string;
}

/**
 * Background task that computes history groupings for a source document.
 * Gets-or-creates the history groupings document, applies the time-window
 * strategy, and writes the aggregated items back into the history doc.
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

  // Currently only one strategy is implemented. The discriminated config is
  // kept so additional strategies can slot in without reshuffling consumers.
  const timeConfig: GroupingStrategyConfig = {
    name: "timeWindow",
    params: { timeWindow: DEFAULT_TIME_WINDOW },
  };
  const strategyKey = getStrategyKey(timeConfig);

  // Re-read the history doc now that any version-reset above has landed.
  const histDoc = historyDocHandle.doc();
  if (!histDoc) {
    console.warn("History task: history document not available after setup");
    return;
  }

  const cachedHeads = histDoc.heads ?? [];
  const existingItems: HistoryItem[] =
    histDoc.groupings?.[strategyKey]?.items ?? [];

  // Incremental update: if we already have a populated cache, only fetch the
  // delta since our cached heads. This is safe because any changes Automerge
  // returns here are either descendants of `cachedHeads` (normal forward
  // progress) or concurrent with them (e.g. synced from a peer that was
  // offline). In either case they appear in the delta and cannot retroactively
  // alter a change that's already inside an existing group — concurrent
  // changes always produce new heads, so they simply tack on new groups at
  // the (chronologically newest) top of the list.
  const canIncrement = cachedHeads.length > 0 && existingItems.length > 0;
  const sinceHeads = canIncrement ? cachedHeads : [];

  const deltaMeta = Automerge.getChangesMetaSince(sourceDoc, sinceHeads);
  const currentHeads = Automerge.getHeads(sourceDoc);

  if (deltaMeta.length === 0) {
    // Nothing new (e.g. cache already matches, or doc is empty). Leave the
    // stored heads alone so future runs still see the cached boundary.
    return;
  }

  // Reverse to get newest first (UI display order)
  deltaMeta.reverse();

  // Project into the minimal working form (hash/actor/time + beforeHead).
  const deltaChanges = changeMetadataToWorkingChanges(deltaMeta);

  // Stitch the boundary: the oldest delta change's `beforeHead` should link
  // back to the newest cached group's latest hash so clicking the new group
  // shows the right "before" state. For single-head histories this is exact;
  // with concurrent heads it's a best-effort display hint.
  if (canIncrement && deltaChanges.length > 0) {
    deltaChanges[deltaChanges.length - 1].beforeHead =
      existingItems[0].latestHash;
  }

  const deltaGrouping = applyGroupingStrategy(timeConfig, deltaChanges);

  historyDocHandle.change((doc: HistoryGroupingsDoc) => {
    doc.heads = currentHeads;
    if (canIncrement && doc.groupings[strategyKey]?.items) {
      // Prepend the newly-computed groups to the existing array so Automerge
      // sees a small insert rather than a full array replacement.
      doc.groupings[strategyKey].items.splice(0, 0, ...deltaGrouping);
    } else {
      doc.groupings[strategyKey] = { items: deltaGrouping };
    }
  });
}

/**
 * Project Automerge change metadata (ordered newest-first) into the minimal
 * working shape used during grouping. Only `hash`, `actor`, `time`, and the
 * link to the previous change's hash are retained — everything else (`seq`,
 * `startOp`, `maxOp`, `message`, `deps`) is discarded here and never makes it
 * into the cached document.
 */
function changeMetadataToWorkingChanges(
  metadata: ChangeMetadata[]
): WorkingChange[] {
  return metadata.map((meta, index) => {
    const change: WorkingChange = {
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

// The constants and `getStrategyKey` below are duplicated from `./utils.ts`
// because relative imports don't resolve correctly when this module is
// dynamically loaded inside the shared-worker task runner. Keep in sync.
export const DEFAULT_TIME_WINDOW = 30 * 60 * 1000; // 30 minutes

/**
 * Generate a unique cache key for a grouping strategy configuration.
 * Each unique combination of strategy name and parameters gets its own cache
 * entry in the history doc's `groupings` map.
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
): (changes: WorkingChange[]) => HistoryItem[] {
  return (changes: WorkingChange[]): HistoryItem[] => {
    if (changes.length === 0) return [];

    const groups: HistoryItem[] = [];
    let currentGroup: WorkingChange[] = [];

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
 * Build a `HistoryItem` from one-or-more changes.
 *
 * A lone change (`changes.length === 1`) produces a `count: 1` item; multi-
 * change runs produce the same shape with `count > 1`. Intermediate per-change
 * data is aggregated into the item and then dropped — only fields the UI
 * reads are retained.
 */
function createItem(changes: WorkingChange[]): HistoryItem {
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

  const item: HistoryItem = {
    id: `item-${changes[0].hash}-${changes.length}`,
    count: changes.length,
    latestHash: changes[0].hash,
    authors,
  };

  if (minTime !== Infinity) {
    item.startTime = minTime;
    item.endTime = maxTime;
  }

  const lastBeforeHead = changes[changes.length - 1].beforeHead;
  if (lastBeforeHead) {
    item.beforeHead = lastBeforeHead;
  }

  return item;
}

/**
 * Push a completed run of changes to the output array as a single
 * `HistoryItem`, regardless of whether the run contains one change or many.
 */
function finalizeGroup(
  items: HistoryItem[],
  currentGroup: WorkingChange[]
): void {
  if (currentGroup.length === 0) return;
  items.push(createItem(currentGroup));
}

/**
 * Apply a grouping strategy configuration to a list of changes.
 *
 * Only `timeWindow` is implemented; `author` is declared in the config type
 * but not wired up yet (needs proper author data, e.g. via Keyhive).
 */
function applyGroupingStrategy(
  config: GroupingStrategyConfig,
  changes: WorkingChange[]
): HistoryItem[] {
  switch (config.name) {
    case "timeWindow": {
      const windowMs = config.params?.timeWindow ?? DEFAULT_TIME_WINDOW;
      return groupByTimeWindow(windowMs)(changes);
    }
    case "author":
      throw new Error("Author grouping is not implemented yet");
    default:
      throw new Error(`Unknown strategy: ${(config as { name: string }).name}`);
  }
}
