import { FolderDoc } from "@/packages/folder";
import * as A from "@automerge/automerge";
import { Doc, DocHandle, StorageId } from "@automerge/automerge-repo";
import fs from "fs";
import path from "path";

export function getBuildMetadataDocUrl(folderDoc: Doc<FolderDoc>) {
  return folderDoc.docs.find((link) => link.name === "Build Metadata")?.url;
}

export async function waitForSync(
  handlesToWaitOn: DocHandle<unknown>[],
  syncServerStorageId: StorageId
) {
  console.log("Waiting for files to sync...");

  return Promise.all(
    handlesToWaitOn.map(
      (handle) =>
        new Promise((resolve) => {
          const newHeads = A.getHeads(handle.docSync());
          const remoteHeads = handle.getRemoteHeads(syncServerStorageId);

          // If the remote heads are already up to date, we can resolve immediately.
          if (A.equals(newHeads, remoteHeads)) {
            resolve(true);
          }

          // Otherwise, we wait to receive updated an remote-heads event
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

export const getJacquardConfig = () => {
  const currentDir = process.cwd();

  const configFilePath = path.join(currentDir, "jacquard.json");

  if (fs.existsSync(configFilePath)) {
    try {
      const configFileContents = fs.readFileSync(configFilePath, "utf8");
      return JSON.parse(configFileContents);
    } catch (error) {
      console.warn("invalid jacquard.json file");
      return null;
    }
  } else {
    return null;
  }
};
