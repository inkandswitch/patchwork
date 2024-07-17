import fs from "fs";
import path from "path";
import { CommandLineArgs } from ".";
import { Repo, isValidAutomergeUrl } from "@automerge/automerge-repo";
import { FolderDoc } from "@/packages/folder";
import { FileDoc } from "../../packages/file/src/datatype";
import { BranchDoc, DocCloneMap } from "@/sdk";

const lookupClone = (cloneMap: DocCloneMap, docUrl: AutomergeUrl) => {
  return cloneMap[docUrl]?.url ?? docUrl;
};

// Activate a branch and represent its files on disk.
// TODO: warn people if they have pending un-pushed changes on disk?
export async function activateBranch(
  repo: Repo,
  { projectFolderUrl, dir, branchUrl }: CommandLineArgs
) {
  let cloneMap: DocCloneMap = {};
  if (branchUrl !== "main" && isValidAutomergeUrl(branchUrl)) {
    const branchDoc = await repo.find<BranchDoc>(branchUrl).doc();
    cloneMap = branchDoc.clones;
  }

  const folderUrl = lookupClone(cloneMap, projectFolderUrl);
  let handle = repo.find<FolderDoc>(folderUrl);
  const doc = await handle.doc();

  if (!doc) {
    console.error(`Could not find ${folderUrl}: ${handle.state}`);
    process.exit(1);
  }

  // todo: handle nested folders
  await Promise.all(
    doc.docs.map(async (docLink) => {
      const clonedUrl = lookupClone(cloneMap, docLink.url);
      const handle = repo.find<FileDoc>(clonedUrl);
      const fileDoc = await handle.doc();

      // todo: handle other docs that are not files
      if (docLink.type !== "file") {
        console.log(`skip ${docLink.name}`);
        return;
      }

      fs.writeFileSync(path.join(dir, fileDoc.name), fileDoc.content);
    })
  );
}
