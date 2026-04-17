import * as Automerge from "@automerge/automerge";
import type { ChangeMetadata } from "@automerge/automerge";
import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type { AutomergeUrl } from "@automerge/automerge-repo/slim";
import {
  makeDocumentProjection,
  useDocument,
} from "@automerge/automerge-repo-solid-primitives";
import {
  createMemo,
  createEffect,
  createSignal,
  Accessor,
  onCleanup,
} from "solid-js";
import type {
  HistoryItem,
  GroupingStrategyConfig,
  HistoryGroupingsDoc,
} from "../../types";
import type { HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import { getStrategyKey } from "../utils";
import * as tasklib from "@awarth/tasklib";

/**
 * Same account field and default queue URL as `@patchwork/tasks` titlebar
 * (`patchwork-tools/tasks/src/helpers.ts`), so history grouping jobs use the
 * user's configured task queue when present.
 */
const TASK_QUEUE_URLS_FIELD_NAME = "__taskQueues__";

function resolveTaskQueueDocUrl(account: unknown): AutomergeUrl {
  const map = (account as Record<string, unknown>)[
    TASK_QUEUE_URLS_FIELD_NAME
  ] as Record<string, boolean> | undefined;
  if (map && typeof map === "object") {
    const keys = Object.keys(map);
    if (keys.length > 0) return keys[0] as AutomergeUrl;
  }
  throw new Error("No task queue doc URL found");
}

function getAccountDocSnapshot(): unknown {
  if (typeof window === "undefined") return undefined;
  const w = window as { accountDocHandle?: { doc?: () => unknown } };
  return w.accountDocHandle?.doc?.();
}

const taskQueueClients = new Map<
  AutomergeUrl,
  ReturnType<typeof tasklib.queue>
>();

function queueForDocUrl(url: AutomergeUrl) {
  let q = taskQueueClients.get(url);
  if (!q) {
    q = tasklib.queue(url);
    taskQueueClients.set(url, q);
  }
  return q;
}

const DEBOUNCE_TIME = 5000; // 5 seconds
const THROTTLE_MS = 30 * 1000; // 30 second throttle for task re-runs on the same document

/**
 * Hook that manages history grouping with the history document as the source
 * of truth for stored groupings, plus a synthesized "virtual" trailing item
 * for any changes that have landed since the last task run.
 *
 * A single change-listener on the source handle:
 * - publishes the current source heads into a reactive signal, and
 * - (re)dispatches the background grouping task when appropriate
 *   (bootstrap / heads-differ, subject to debounce and task-side throttle).
 *
 * The returned accessor combines the stored groupings with a runtime-only
 * `HistoryItem` covering the delta between the source doc's current heads
 * and the history doc's cached heads. That virtual item disappears once the
 * task folds the tail into the stored groupings.
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

  // PART 2: Subscribe to history document reactively (for UI updates)
  const [historyDoc, historyDocHandle] = useDocument<HistoryGroupingsDoc>(
    historyUrl,
    { repo }
  );

  let lastDispatchTime = 0;
  let taskDispatchDelayTimer: ReturnType<typeof setTimeout> | undefined;

  const dispatchTask = (sourceUrl: AutomergeUrl) => {
    const queueDocUrl = resolveTaskQueueDocUrl(getAccountDocSnapshot());
    queueForDocUrl(queueDocUrl).addTask<AutomergeUrl, void>({
      input: sourceUrl,
      importUrl: new URL(/* @vite-ignore */ "../task.js", import.meta.url),
    });
    lastDispatchTime = Date.now();
  };

  // PART 3: Watch the source document. On every change (and once at setup)
  // we update `sourceHeads` so the items memo below can re-render the virtual
  // trailing tail, and decide whether to (re)dispatch the grouping task.
  //
  // Dispatch logic:
  // - If no history doc exists yet, always dispatch (bootstrap path).
  // - If heads match the history doc's cached heads, do nothing.
  // - If heads differ, dispatch — subject to a client-side debounce (ignore
  //   rapid refires after we just dispatched) and to the task's own throttle
  //   (avoid enqueuing work the task would skip anyway).
  const [sourceHeads, setSourceHeads] = createSignal<string[] | undefined>(
    undefined
  );

  createEffect(() => {
    const source = sourceHandle();
    if (!source) {
      setSourceHeads(undefined);
      return;
    }

    const onChange = () => {
      const sourceRawDoc = source.doc();
      if (!sourceRawDoc) return;

      // Publish current source heads so the items memo picks up new tails.
      const currentHeads = Automerge.getHeads(sourceRawDoc);
      setSourceHeads(currentHeads);

      const now = Date.now();

      // Debounce: ignore changes for a short window after our last dispatch
      // to avoid re-enqueuing before the first task has even started.
      const elapsed = now - lastDispatchTime;
      if (elapsed < DEBOUNCE_TIME) {
        if (!taskDispatchDelayTimer) {
          taskDispatchDelayTimer = setTimeout(() => {
            taskDispatchDelayTimer = undefined;
            onChange();
          }, DEBOUNCE_TIME - elapsed);
        }
        return;
      }

      const hHandle = historyDocHandle();
      const histDoc = hHandle?.doc();

      // Bootstrap: no history doc yet — dispatch to create one.
      if (!histDoc) {
        dispatchTask(source.url);
        return;
      }

      // Heads match — cache is current, nothing to do.
      if (headsEqual(currentHeads, histDoc.heads ?? [])) return;

      // Heads differ — throttle per the task's last-run time.
      const lastUpdate = histDoc.updatedAt ?? 0;
      const throttleMs = histDoc.throttleMs ?? THROTTLE_MS;
      const elapsedSinceUpdate = now - lastUpdate;
      if (elapsedSinceUpdate < throttleMs) {
        if (!taskDispatchDelayTimer) {
          taskDispatchDelayTimer = setTimeout(() => {
            taskDispatchDelayTimer = undefined;
            onChange();
          }, throttleMs - elapsedSinceUpdate);
        }
        return;
      }

      dispatchTask(source.url);
    };

    source.on("change", onChange);
    onChange();

    onCleanup(() => {
      source.off("change", onChange);
      clearTimeout(taskDispatchDelayTimer);
      taskDispatchDelayTimer = undefined;
    });
  });

  // PART 4: Return reactive items. If the source doc has advanced past the
  // cached heads, synthesize a single "virtual" item at the top of the list
  // covering the ungrouped tail. The virtual item is never stored; it
  // disappears once the background task runs and folds the tail into the
  // cached groupings.
  return createMemo<HistoryItem[]>(() => {
    const doc = historyDoc();
    const strategyKey = getStrategyKey(strategyConfig());
    const storedItems: HistoryItem[] = doc?.groupings?.[strategyKey]?.items ?? [];

    const cachedHeads = doc?.heads ?? [];
    const currentSourceHeads = sourceHeads();
    if (!currentSourceHeads || headsEqual(currentSourceHeads, cachedHeads)) {
      return storedItems;
    }

    const handle = sourceHandle();
    const sourceRawDoc = handle?.doc();
    if (!sourceRawDoc) return storedItems;

    const deltaMeta = Automerge.getChangesMetaSince(sourceRawDoc, cachedHeads);
    if (deltaMeta.length === 0) return storedItems;

    // Newest-first to match the cached items ordering.
    deltaMeta.reverse();

    const virtualItem = buildVirtualItem(
      deltaMeta,
      storedItems[0]?.latestHash
    );
    return [virtualItem, ...storedItems];
  });
}

/**
 * Build a single `HistoryItem` covering every change between the history
 * doc's cached heads and the source doc's current heads. This item exists
 * only at runtime — it is never written to the cache.
 */
function buildVirtualItem(
  deltaMeta: ChangeMetadata[],
  firstStoredLatestHash: string | undefined
): HistoryItem {
  const authors: string[] = [];
  let minTime = Infinity;
  let maxTime = -Infinity;
  for (const m of deltaMeta) {
    if (m.actor && !authors.includes(m.actor)) authors.push(m.actor);
    const t = m.time;
    if (t !== undefined) {
      if (t < minTime) minTime = t;
      if (t > maxTime) maxTime = t;
    }
  }

  const item: HistoryItem = {
    id: `virtual-${deltaMeta[0].hash}-${deltaMeta.length}`,
    count: deltaMeta.length,
    latestHash: deltaMeta[0].hash,
    authors,
  };

  if (minTime !== Infinity) {
    item.startTime = minTime;
    item.endTime = maxTime;
  }

  // The change immediately before the virtual tail is the newest stored item's
  // representative hash. Leave `beforeHead` unset on a fresh doc (no stored
  // items yet) so the selection yields a from-genesis diff.
  if (firstStoredLatestHash) {
    item.beforeHead = firstStoredLatestHash;
  }

  return item;
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
