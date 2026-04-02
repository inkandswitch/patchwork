import * as Automerge from "@automerge/automerge";
import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type { AutomergeUrl } from "@automerge/automerge-repo/slim";
import {
  makeDocumentProjection,
  useDocument,
} from "@automerge/automerge-repo-solid-primitives";
import { createMemo, createEffect, Accessor, onCleanup } from "solid-js";
import type {
  HistoryGroupingsDoc,
  StoredChangeEntry,
} from "../../types";
import type { HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import * as tasklib from "@awarth/tasklib";

const DEBOUNCE_TIME = 5000; // 5 seconds
const THROTTLE_MS = 30 * 1000; // 30 second throttle for task re-runs on the same document

/**
 * Hook that manages history data with history document as source of truth.
 *
 * Returns raw minute-keyed groupings from the history document.
 * Grouping strategies are applied separately by the consumer.
 *
 * A single effect actively watches the source document and dispatches a
 * background task to create or update the history document:
 * - If no history doc exists, dispatches immediately (task creates it)
 * - If history doc exists and heads match, does nothing
 * - If history doc exists but heads differ, dispatches with throttle
 *
 * @param sourceHandle - Handle to the source document
 * @param repo - Automerge repository
 * @param taskQueueUrl - Task queue URL for dispatching background tasks
 * @returns Reactive accessor to raw minute-keyed groupings
 */
export function useCachedHistory(
  sourceHandle: Accessor<DocHandle<unknown> | undefined>,
  repo: Repo,
  taskQueueUrl: Accessor<AutomergeUrl | undefined>
): Accessor<{ [minuteTimestamp: string]: StoredChangeEntry[] } | undefined> {
  const sourceDoc = createMemo(() => {
    const handle = sourceHandle();
    if (!handle) return undefined;
    return makeDocumentProjection(handle as DocHandle<HasPatchworkMetadata>);
  });

  // STEP 1: Get history document URL from source document
  const historyUrl = createMemo<AutomergeUrl | undefined>(() => {
    const handle = sourceHandle();
    const doc = sourceDoc();
    if (!handle || !doc) return undefined;

    const metadata = (doc as HasPatchworkMetadata)?.["@patchwork"];
    return metadata?.history as AutomergeUrl | undefined;
  });

  // STEP 2: Subscribe to history document reactively (for UI updates)
  const [historyDoc, historyDocHandle] = useDocument<HistoryGroupingsDoc>(
    historyUrl,
    { repo }
  );

  let lastDispatchTime = 0;
  let taskDispatchDelayTimer: ReturnType<typeof setTimeout> | undefined;

  const dispatchTask = (sourceUrl: AutomergeUrl) => {
    const queueUrl = taskQueueUrl();
    if (!queueUrl) return;

    const taskQueue = tasklib.queue(queueUrl);
    taskQueue.addTask<AutomergeUrl, void>({
      input: sourceUrl,
      importUrl: new URL(/* @vite-ignore */ "../task.js", import.meta.url),
    });
    lastDispatchTime = Date.now();
  };

  // STEP 3: Handle initial load and missing history document
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
      // TODO: we should check the history doc staleness & update if needed, but we don't want to dispatch a task every time the doc loads if not.
      // dispatchTask(source.url);
    }
  });

  // STEP 4: Subscribe to source document changes and update history as needed
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

  // Return raw groupings from the history document
  return createMemo(() => {
    const doc = historyDoc();
    if (!doc) return undefined;
    return doc.groupings;
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
