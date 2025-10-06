import {
  Archive,
  CiphertextStore,
  DocumentId as KeyhiveDocumentId,
  Event as KeyhiveEvent,
  Keyhive,
  Signer,
} from "@keyhive/keyhive/slim";
import {
  AutomergeUrl,
  StorageAdapterInterface,
  parseAutomergeUrl,
} from "@automerge/automerge-repo/slim";
import { Active } from "./active";
import {
  KEYHIVE_DB_KEY,
  saveKeyhiveWithHash,
} from "@automerge/automerge-keyhive-network-adapter";
import { SyncServer } from "./sync-server";

export type KeyhiveArchiveBytes = Uint8Array;

export function docIdFromAutomergeUrl(url: AutomergeUrl): KeyhiveDocumentId {
  const { binaryDocumentId } = parseAutomergeUrl(url);
  return new KeyhiveDocumentId(binaryDocumentId);
}

export async function loadOrCreateKeyhive(
  db: StorageAdapterInterface,
  signer: Signer,
  event_handler: (event: KeyhiveEvent) => void
): Promise<Keyhive> {
  const keyhiveArchiveChunks = await db.loadRange([KEYHIVE_DB_KEY]);
  if (keyhiveArchiveChunks.length > 0) {
    const firstChunk = keyhiveArchiveChunks[0];
    // TODO: Something went wrong if data is missing.
    if (firstChunk.data) {
      const firstArchive = new Archive(firstChunk.data);
      try {
        console.log("Attempting to load Keyhive archive");
        let store = CiphertextStore.newInMemory();
        const kh = firstArchive.tryToKeyhive(store, signer, event_handler);
        for (const chunk of keyhiveArchiveChunks.slice(1)) {
          if (chunk.data) {
            await kh.ingestArchive(new Archive(chunk.data));
          }
        }
        console.log("Successfully loaded Keyhive from archive");
        await saveKeyhiveWithHash(kh, db);
        for (const chunk of keyhiveArchiveChunks) {
          await db.remove(chunk.key);
        }
        return kh;
      } catch (error: unknown) {
        const jsError = (error as { toError: () => Error }).toError();
        console.log("Failed to load Keyhive archive:", jsError);
      }
    }
  }

  const store = CiphertextStore.newInMemory();
  const kh = await Keyhive.init(signer, store, event_handler);
  await saveKeyhiveWithHash(kh, db);
  return kh;
}

export type KeyhiveKit = {
  active: Active;
  keyhive: Keyhive;
  syncServer: SyncServer;
  accountUrl: AutomergeUrl;
};
