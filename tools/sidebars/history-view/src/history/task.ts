import type { AutomergeUrl } from "@automerge/automerge-repo";
import { Automerge } from "@automerge/automerge-repo/slim";
import type { HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import type { HistoryGroupingsDoc, StoredChangeEntry } from "../types";
import type { ChangeMetadata } from "@automerge/automerge";

const THROTTLE_MS = 30 * 1000; // 30 second throttle for task re-runs on the same document

/**
 * Background task that computes history data for a source document.
 * Stores changes in 1-minute increments keyed by minute timestamp,
 * with entries stored oldest-first within each minute bucket.
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
      version: 2,
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
    // Check throttle before computing to avoid duplicate tasks
    const histDoc = historyDocHandle.doc();
    if (!histDoc) {
      console.warn("History task: history document not available");
      return;
    }
    const lastUpdate = histDoc.updatedAt ?? 0;
    const throttleMs = histDoc.throttleMs ?? THROTTLE_MS;
    if (now - lastUpdate < throttleMs) return;

    // Mark that a task is running — write timestamp before computation to avoid duplicate tasks
    historyDocHandle.change((doc: HistoryGroupingsDoc) => {
      doc.updatedAt = now;
    });
  }

  // Get all metadata for all changes since the beginning
  const allMeta = Automerge.getChangesMetaSince(sourceDoc, []);
  const currentHeads = Automerge.getHeads(sourceDoc);

  // Build minute-increment changes
  const minuteChanges = buildMinuteChanges(allMeta);

  // Write to history doc
  historyDocHandle.change((doc: HistoryGroupingsDoc) => {
    doc.version = 2;
    doc.heads = currentHeads;
    doc.groupings = minuteChanges;
  });
}

/**
 * Organize change metadata into 1-minute increments.
 * Each minute key is the Unix seconds timestamp at the start of that minute.
 */
function buildMinuteChanges(
  metadata: ChangeMetadata[]
): Record<string, StoredChangeEntry[]> {
  const changes: Record<string, StoredChangeEntry[]> = {};

  for (const meta of metadata) {
    const minuteKey = String(Math.floor(meta.time / 60) * 60);
    if (!changes[minuteKey]) changes[minuteKey] = [];
    changes[minuteKey].push({
      head: meta.hash,
      message: meta.message,
      time: meta.time,
      actor: meta.actor,
    });
  }

  return changes;
}
