/**
 * Maintenance helpers for the local Automerge IndexedDB store.
 *
 * The repo keeps two kinds of record in `automerge/documents`, distinguishable
 * by key shape:
 *
 *   - Automerge document chunks: `[<documentId>, "snapshot" | "incremental" |
 *     "sync-state", <hash>]` — the materialized document data.
 *   - Subduction sync data: `["subduction", "commits" | "blobs" | "fragments" |
 *     …, …]` — the sync layer's commit/blob log, which accumulates over time.
 *
 * These helpers selectively delete one kind, leaving the other in place. The
 * signing key (the `subduction-signer` database) and logs (`patchwork-logs-*`)
 * live in entirely separate databases that are never opened here, so they are
 * always preserved. Both kinds re-fetch from the sync server, so dropping
 * either is recoverable; reload afterwards so the worker rehydrates from what
 * remains.
 */

export interface DropResult {
  /** Records removed. */
  deleted: number;
  /** Records left in place. */
  kept: number;
}

const AUTOMERGE_RECORD_TYPES = new Set([
  "snapshot",
  "incremental",
  "sync-state",
]);

/** True only for keys Subduction owns (`["subduction", …]`). */
export function isSubductionKey(key: unknown): boolean {
  return Array.isArray(key) && key[0] === "subduction";
}

/**
 * True only for Automerge document chunks (`[<docId>, "snapshot" |
 * "incremental" | "sync-state", …]`). Explicitly excludes the `subduction`
 * namespace so the two predicates are disjoint and can never overlap.
 */
export function isAutomergeKey(key: unknown): boolean {
  return (
    Array.isArray(key) &&
    key[0] !== "subduction" &&
    typeof key[1] === "string" &&
    AUTOMERGE_RECORD_TYPES.has(key[1])
  );
}

async function dropMatching(
  predicate: (key: unknown) => boolean,
  dbName: string,
  storeName: string
): Promise<DropResult> {
  if (typeof indexedDB === "undefined") {
    throw new Error("indexedDB is not available in this context");
  }

  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  try {
    if (!db.objectStoreNames.contains(storeName)) {
      return { deleted: 0, kept: 0 };
    }
    return await new Promise<DropResult>((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      let deleted = 0;
      let kept = 0;
      const request = store.openCursor();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        if (predicate(cursor.key)) {
          cursor.delete();
          deleted++;
        } else {
          kept++;
        }
        cursor.continue();
      };
      tx.oncomplete = () => resolve({ deleted, kept });
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/**
 * Drop Subduction's sync records, leaving Automerge documents, the signing key,
 * and logs intact. Reclaims the space Subduction's commit/blob log accumulates.
 */
export function dropSubductionStorage(
  dbName = "automerge",
  storeName = "documents"
): Promise<DropResult> {
  return dropMatching(isSubductionKey, dbName, storeName);
}

/**
 * Drop the Automerge document chunks, leaving Subduction's commit log, the
 * signing key, and logs intact. Destructive: this removes the materialized
 * document data. It re-materializes from the (kept) Subduction log and the sync
 * server on reload, so synced documents come back — but treat it as a reset.
 */
export function dropAutomergeStorage(
  dbName = "automerge",
  storeName = "documents"
): Promise<DropResult> {
  return dropMatching(isAutomergeKey, dbName, storeName);
}
