import * as Automerge from "@automerge/automerge";
import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type { AutomergeUrl } from "@automerge/automerge-repo/slim";
import {
  makeDocumentProjection,
  useDocument,
} from "@automerge/automerge-repo-solid-primitives";
import { createMemo, createEffect, Accessor } from "solid-js";
import type {
  HistoryItem,
  GroupingStrategyConfig,
  HistoryGroupingsDoc,
} from "../../types";
import type { HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import { getStrategyKey } from "../utils";
import * as tasklib from "@awarth/tasklib";

const taskQueue = tasklib.queue(
  "automerge:3AXXV4FHVom6sWu1rD8kBRWq9Bmd" as AutomergeUrl
);

/**
 * Hook that manages history grouping with history document as source of truth.
 *
 * Dispatches a background task to create/update the history document:
 * - If no history doc exists, dispatches immediately (task creates it)
 * - If history doc exists but cache is stale, dispatches with throttle
 *
 * REACTIVE FLOW:
 * - Task creates/updates history doc → source doc gets history URL → hook subscribes
 * - History doc updates → UI updates reactively
 *
 * @param sourceHandle - Handle to the source document
 * @param strategyConfig - Grouping strategy configuration (reactive)
 * @param repo - Automerge repository
 * @returns Reactive accessor to grouped history items
 */
export function useCachedHistory(
  sourceHandle: Accessor<DocHandle<unknown> | undefined>,
  strategyConfig: Accessor<GroupingStrategyConfig>,
  repo: Repo
): Accessor<HistoryItem[]> {
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

  // PART 2: If no history doc exists, dispatch task to create one
  createEffect(() => {
    if (historyUrl()) return; // history doc already exists, handled by PART 4

    const source = sourceHandle();
    if (!source) return;

    // No history doc — dispatch task to create it
    taskQueue.addTask<AutomergeUrl, void>({
      input: source.url,
      importUrl: new URL(/* @vite-ignore */ "../task.js", import.meta.url),
    });
  });

  // PART 3: Subscribe to history document reactively (for UI updates)
  const [historyDoc, historyDocHandle] = useDocument<HistoryGroupingsDoc>(
    historyUrl,
    { repo }
  );

  // PART 4: Throttled staleness check (only when history doc exists)
  // Uses updatedAt and throttleMs from the history doc to throttle task dispatch.
  // Re-runs reactively when historyDocHandle() changes (e.g. when
  // the task writes updatedAt or heads)
  createEffect(() => {
    const source = sourceHandle();
    const hHandle = historyDocHandle();
    if (!source || !hHandle) return;

    const sourceDoc = source.doc();
    const histDoc = hHandle.doc();
    if (!sourceDoc || !histDoc) return;

    const currentHeads = Automerge.getHeads(sourceDoc);
    const cachedHeads = histDoc.heads;

    // Cache is current — nothing to do
    if (cachedHeads && headsEqual(currentHeads, cachedHeads)) return;

    // Cache is stale — check if a task ran recently (throttle)
    const now = Date.now();
    const lastUpdate = histDoc.updatedAt ?? 0;
    const throttleMs = histDoc.throttleMs ?? 2 * 60 * 1000;
    if (now - lastUpdate < throttleMs) return;

    // Dispatch full computation task
    taskQueue.addTask<AutomergeUrl, void>({
      input: source.url,
      importUrl: new URL(/* @vite-ignore */ "../task.js", import.meta.url),
    });
  });

  // PART 5: Return reactive items that update when history doc or strategy changes
  return createMemo<HistoryItem[]>(() => {
    const doc = historyDoc(); // reactive read - subscribes to history doc
    if (!doc) return [];

    const strategyKey = getStrategyKey(strategyConfig());
    const cached = doc.groupings?.[strategyKey];
    return cached?.items || [];
  });
}

/**
 * Check if two heads arrays are equal (order-independent)
 */
function headsEqual(heads1: string[], heads2: string[]): boolean {
  if (heads1.length !== heads2.length) {
    return false;
  }

  return heads1.every((h) => heads2.includes(h));
}
