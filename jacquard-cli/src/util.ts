import * as A from "@automerge/automerge";
import { FolderDoc } from "@/packages/folder";
import { Doc, DocHandle, StorageId } from "@automerge/automerge-repo";

export function getBuildMetadataDocUrl(folderDoc: Doc<FolderDoc>) {
  return folderDoc.docs.find((link) => link.name === "Build Metadata")?.url;
}

export async function waitForSync(
  handlesToWaitOn: DocHandle<unknown>[],
  syncServerStorageId: StorageId
) {
  return Promise.all(
    handlesToWaitOn.map(
      (handle) =>
        new Promise((resolve) => {
          const newHeads = A.getHeads(handle.docSync());
          handle.on("remote-heads", ({ storageId, heads }) => {
            if (
              storageId === syncServerStorageId &&
              A.equals(newHeads, heads)
            ) {
              resolve(true);
            }
          });
        })
    )
  );
}
