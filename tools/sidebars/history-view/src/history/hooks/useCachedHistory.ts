import * as Automerge from "@automerge/automerge";
import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type { AutomergeUrl } from "@automerge/automerge-repo/slim";
import {
  makeDocumentProjection,
  useDocument,
} from "@automerge/automerge-repo-solid-primitives";
import { createMemo, createEffect, Accessor, onCleanup } from "solid-js";
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
 * Hook that manages history grouping with history document as source of truth.
 *
 * A single effect actively watches the source document and dispatches a
 * background task to create or update the history document:
 * - If no history doc exists, dispatches immediately (task creates it)
 * - If history doc exists and heads match, does nothing
 * - If history doc exists but heads differ, dispatches with throttle
 *
 * REACTIVE FLOW:
 * - Source doc changes → effect checks history doc → dispatches task if needed
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

  // PART 3: Handle initial load and missing history document
  createEffect(() => {
    const source = sourceHandle();
    if (!source) return;
    const sourceRawDoc = source.doc();

    if (!(sourceRawDoc as HasPatchworkMetadata)?.["@patchwork"]?.history) {
      // No history doc exists — dispatch task to create it
      dispatchTask(source.url);
      return;
    } else {
      // update in case there have been changes since the history doc was last loaded
      // TODO: we should check the history doc staleness & throttle
      dispatchTask(source.url);
    }
  });

  // PART 4: Subscribe to source document changes and update history as needed
  // Re-runs reactively when source doc, history URL, or history doc changes.
  // Reading sourceDoc() (the reactive projection) establishes a Solid dependency
  // so this effect re-runs when the document content changes.
  createEffect(() => {
    const source = sourceHandle();
    if (!source) return;

    const onChange = () => {
      const now = Date.now();
      // Debounce: ignore changes for 5s after a task dispatch
      const elapsed = now - lastDispatchTime;
      if (elapsed < DEBOUNCE_TIME) {
        // Ensure we re-check after the debounce window expires
        if (!taskDispatchDelayTimer) {
          taskDispatchDelayTimer = setTimeout(() => {
            taskDispatchDelayTimer = undefined;
            onChange();
          }, DEBOUNCE_TIME - elapsed);
        }
        return;
      }

      // Use the raw doc from the handle for getHeads (needs the Automerge doc, not the projection)
      const sourceRawDoc = source.doc();
      if (!sourceRawDoc) return;

      const hHandle = historyDocHandle();
      if (!hHandle) return;

      const histDoc = hHandle.doc();
      if (!histDoc) return;

      // Check staleness by comparing heads of source doc and cached heads in history doc
      const currentHeads = Automerge.getHeads(sourceRawDoc);
      const cachedHeads = histDoc.heads;

      // Heads match — cache is current, nothing to do
      if (cachedHeads && headsEqual(currentHeads, cachedHeads)) return;

      // Heads differ — check throttle before dispatching task to update cache
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

      // Dispatch task to recompute
      dispatchTask(source.url);
    };

    source.on("change", onChange);
    onCleanup(() => {
      source.off("change", onChange);
      clearTimeout(taskDispatchDelayTimer);
      taskDispatchDelayTimer = undefined;
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
