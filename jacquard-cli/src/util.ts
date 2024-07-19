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
  console.log("Waiting for sync");

  // idk if that fancy stuff works
  await new Promise((resolve) => {
    setTimeout(resolve, 10000);
  });
  return;

  return Promise.all(
    handlesToWaitOn.map(
      (handle) =>
        new Promise((resolve) => {
          const newHeads = A.getHeads(handle.docSync());
          handle.on("remote-heads", ({ storageId, heads }) => {
            console.log("got remote heads", storageId, heads);
            if (
              storageId === syncServerStorageId &&
              A.equals(newHeads, heads)
            ) {
              console.log("match!");
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
      console.warn("invalid jacquare.json file");
      return null;
    }
  } else {
    return null;
  }
};
