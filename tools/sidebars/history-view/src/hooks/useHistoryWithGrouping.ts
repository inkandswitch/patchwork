import * as Automerge from "@automerge/automerge";
import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type { AutomergeUrl } from "@automerge/automerge-repo/slim";
import {
  makeDocumentProjection,
  useDocument,
} from "@automerge/automerge-repo-solid-primitives";
import {
  createMemo,
  createEffect,
  on,
  onCleanup,
  Accessor,
  createSignal,
} from "solid-js";
import type {
  HistoryItem,
  GroupingStrategyConfig,
  HistoryGroupingsDoc,
  HistoryChange,
} from "../types";
import type { HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import { isHistoryGroup } from "../types";
import { getStrategyKey, applyGroupingStrategy } from "../grouping/strategies";
import { computeIncrementalGroups } from "../grouping/incrementalUpdate";
import {
  getOrCreateGroupingsDoc,
  headsEqual,
} from "../services/groupingsManager";

/** Narrow type for accessing HistoryGroup properties inside Automerge change callbacks */
interface MutableHistoryGroup {
  changes: HistoryChange[];
  startTime?: number;
  endTime?: number;
}

/**
 * Unified hook that manages history grouping with history document as source of truth
 *
 * KEY OPTIMIZATIONS:
 * 1. History document is the single source of truth (no dual state)
 * 2. Only reads LAST item on source changes (O(1) instead of O(n))
 * 3. Only writes NEW groups (incremental, not full array)
 * 4. No circular dependencies (reactive vs non-reactive reads)
 *
 * REACTIVE FLOW:
 * - Source doc changes → compute incremental → write to history doc
 * - History doc updates → UI updates reactively
 * - Writing to history doc does NOT trigger source onChange (no circular dependency)
 *
 * @param sourceHandle - Handle to the source document
 * @param strategyConfig - Grouping strategy configuration (reactive)
 * @param repo - Automerge repository
 * @returns Reactive accessor to grouped history items
 */
export function useHistoryWithGrouping(
  sourceHandle: Accessor<DocHandle<unknown> | undefined>,
  strategyConfig: Accessor<GroupingStrategyConfig>,
  repo: Repo
): Accessor<HistoryItem[]> {
  const [historyInitialized, setHistoryInitialized] = createSignal(false);

  const sourceDoc = createMemo(() => {
    const handle = sourceHandle();
    if (!handle) return undefined;
    return makeDocumentProjection(handle as DocHandle<HasPatchworkMetadata>);
  });

  // PART 1: Get history document URL from source document
  const historyUrl = createMemo<AutomergeUrl | undefined>(() => {
    const handle = sourceHandle();
    const doc = sourceDoc();
    if (!handle || !doc) return undefined;

    const metadata = (doc as HasPatchworkMetadata)?.["@patchwork"];
    return metadata?.history as AutomergeUrl | undefined;
  });

  // PART 2: Subscribe to history document reactively (for UI updates)
  const [historyDoc, historyDocHandle] = useDocument<HistoryGroupingsDoc>(
    historyUrl,
    { repo }
  );

  // PART 3: Initialize history document if needed
  createEffect(async () => {
    const handle = sourceHandle();
    const hUrl = historyUrl();

    if (handle && !hUrl && !historyInitialized()) {
      try {
        // No history doc exists - create one
        setHistoryInitialized(true);
        await getOrCreateGroupingsDoc(
          repo,
          handle as DocHandle<HasPatchworkMetadata>
        );
      } catch (error) {
        console.error(
          "Unexpected error during history document initialization:",
          error
        );
        // Do NOT reset historyInitialized — resetting it re-triggers this effect,
        // causing an infinite loop since the same error will occur again.
      }
    }
  });

  // Reset initialization flag when the source document changes,
  // so a new document can trigger history creation.
  createEffect(
    on(sourceHandle, () => setHistoryInitialized(false), { defer: true })
  );

  // Reset initialization flag when historyUrl becomes defined (i.e., initialization
  // succeeded). This prepares the flag for a future re-initialization if the history
  // URL is later removed.
  createEffect(
    on(
      historyUrl,
      (url) => {
        if (url) setHistoryInitialized(false);
      },
      { defer: true }
    )
  );

  // PART 4: Handle initial load and cache staleness
  createEffect(() => {
    const hHandle = historyDocHandle();
    const source = sourceHandle();
    const config = strategyConfig();

    if (!hHandle || !source) return;

    updateIncremental(source, hHandle, config);
  });

  // PART 5: Subscribe to source document changes
  createEffect(() => {
    const source = sourceHandle();
    if (!source) return;

    const onChange = () => {
      const hHandle = historyDocHandle();
      if (!hHandle) return;

      const config = strategyConfig();
      updateIncremental(source, hHandle, config);
    };

    source.on("change", onChange);
    onCleanup(() => source.off("change", onChange));
  });

  // PART 6: Return reactive items that update when history doc or strategy changes
  // UI reads FULL array for display (only happens on UI updates, not on every source change)
  return createMemo<HistoryItem[]>(() => {
    const doc = historyDoc(); // REACTIVE read - subscribes to history doc
    if (!doc) return [];

    const strategyKey = getStrategyKey(strategyConfig());
    const cached = doc.groupings?.[strategyKey];
    return cached?.items || [];
  });
}

/**
 * Incremental update when there's a cached grouping for the strategy
 * Reads last item and new changes, and writes new groups, combining with the last group if needed.
 */
function updateIncremental(
  sourceHandle: DocHandle<unknown>,
  historyHandle: DocHandle<HistoryGroupingsDoc>,
  config: GroupingStrategyConfig
): void {
  const strategyKey = getStrategyKey(config);

  // NON-REACTIVE read (O(1)) - just get reference to cached grouping
  const doc = historyHandle.doc();
  const cached = doc.groupings?.[strategyKey];

  if (!cached) {
    // No cache for this strategy - do full recompute
    computeFullHistory(sourceHandle, historyHandle, config);
    return;
  }

  // Check if cache is stale
  const currentHeads = Automerge.getHeads(sourceHandle.doc());
  if (currentHeads && cached.heads && headsEqual(currentHeads, cached.heads)) {
    return; // Cache is current, nothing to do
  }
  // Stale cache - do incremental update
  // Get only new changes since last processed heads
  const newChangesMeta = Automerge.getChangesMetaSince(
    sourceHandle.doc(),
    cached.heads || [] // if cached.heads is undefined, treat as empty (i.e., get all changes)
  );

  // TODO: error - if there are no new changes and heads are different, something is very wrong
  if (newChangesMeta.length === 0) return; // No new changes
  newChangesMeta.reverse(); // reverse to get newest first

  // Read ONLY newest item from cached grouping to determine how to merge new changes
  const newestItem = cached.items[0];

  // Convert metadata to history changes
  const historyChanges: HistoryChange[] = newChangesMeta.map((meta, i) => {
    const beforeHead = newChangesMeta[i + 1]?.hash;
    const change: HistoryChange = {
      hash: meta.hash,
      metadata: meta,
    };
    if (beforeHead) {
      change.beforeHead = beforeHead;
    }
    return change;
  });
  // beforeHead is not available for the oldest change; get it from the newestItem
  if (isHistoryGroup(newestItem) && historyChanges.length > 0) {
    historyChanges[historyChanges.length - 1].beforeHead =
      newestItem.changes[0].hash;
  } else if (!isHistoryGroup(newestItem)) {
    historyChanges[historyChanges.length - 1].beforeHead = newestItem.hash;
  }

  // Compute what groups to add/merge based ONLY on newest item
  const { shouldMergeWithLast, newGroups } = computeIncrementalGroups(
    newestItem,
    historyChanges,
    config
  );

  // Write ONLY modifications (O(k) where k = new groups)
  historyHandle.change((doc: HistoryGroupingsDoc) => {
    const items = doc.groupings[strategyKey].items;

    if (shouldMergeWithLast && newGroups.length > 0) {
      // Merge first new group with newest existing group
      const newestIdx = 0; // the newest is at index 0, because we reversed the history order
      const firstNewGroup = newGroups[0];

      if (isHistoryGroup(items[newestIdx]) && isHistoryGroup(firstNewGroup)) {
        // Both are groups - merge them
        const existingGroup = items[newestIdx] as MutableHistoryGroup;
        const newGroup = firstNewGroup as MutableHistoryGroup;

        existingGroup.changes.push(...newGroup.changes);

        // Update time bounds
        if (newGroup.startTime !== undefined) {
          existingGroup.startTime =
            existingGroup.startTime !== undefined
              ? Math.min(existingGroup.startTime, newGroup.startTime)
              : newGroup.startTime;
        }
        if (newGroup.endTime !== undefined) {
          existingGroup.endTime =
            existingGroup.endTime !== undefined
              ? Math.max(existingGroup.endTime, newGroup.endTime)
              : newGroup.endTime;
        }
      } else if (
        isHistoryGroup(items[newestIdx]) &&
        !isHistoryGroup(firstNewGroup)
      ) {
        // Newest is group, new is change - add change to group
        const existingGroup = items[newestIdx] as MutableHistoryGroup;
        existingGroup.changes.push(firstNewGroup);

        // Update time bounds
        const changeTime = firstNewGroup.metadata?.time;
        if (changeTime !== undefined) {
          existingGroup.startTime =
            existingGroup.startTime !== undefined
              ? Math.min(existingGroup.startTime, changeTime)
              : changeTime;
          existingGroup.endTime =
            existingGroup.endTime !== undefined
              ? Math.max(existingGroup.endTime, changeTime)
              : changeTime;
        }
      } else {
        // Newest is change - replace with first new group (which should be a group)
        items[newestIdx] = firstNewGroup;
      }

      // Add any additional new groups
      if (newGroups.length > 1) {
        items.unshift(...newGroups.slice(1));
      }
    } else {
      // Just prepend new groups
      items.unshift(...newGroups);
    }

    // Update heads
    doc.groupings[strategyKey].heads = currentHeads;
  });
}

/**
 * Full recomputation - only used for initial load or new strategies
 */
function computeFullHistory(
  sourceHandle: DocHandle<unknown>,
  historyHandle: DocHandle<HistoryGroupingsDoc>,
  config: GroupingStrategyConfig
): void {
  const strategyKey = getStrategyKey(config);

  // Get all metadata for all changes since the beginning
  // TODO: do we need both? Is getChangesMetaSince stable?
  const allMeta = Automerge.getChangesMetaSince(sourceHandle.doc(), []);
  const allHashes = Automerge.topoHistoryTraversal(sourceHandle.doc());

  // Reverse to get newest first
  // TODO: maybe we shouldn't reverse
  allHashes.reverse();
  allMeta.reverse();

  // Convert to history changes
  // TODO: if getChangesMetaSince is not stable, should map over the topo hashes
  const historyChanges: HistoryChange[] = allMeta.map((meta, index) => {
    const beforeHead = allHashes[index + 1];
    const change: HistoryChange = {
      hash: meta.hash,
      metadata: meta,
    };
    if (beforeHead) {
      change.beforeHead = beforeHead;
    }
    return change;
  });

  // Apply grouping strategy
  let items = applyGroupingStrategy(config, historyChanges);
  const currentHeads = Automerge.getHeads(sourceHandle.doc());

  // Write to history doc
  historyHandle.change((doc: HistoryGroupingsDoc) => {
    if (!doc.groupings) {
      doc.groupings = {};
    }
    doc.groupings[strategyKey] = {
      items: items as any,
      heads: currentHeads,
    };
  });
}
