import fs from "fs";
import path from "path";
import { CommandLineArgs } from ".";
import { Doc, Repo } from "@automerge/automerge-repo";
import { FolderDoc } from "@/packages/folder";
import { FileDoc } from "../../packages/file/src/datatype";
import { findWithActiveBranch } from "./findWithActiveBranch";

export async function pull(
  repo: Repo,
  { projectFolderUrl, dir }: CommandLineArgs
) {
  const folderHandle = await findWithActiveBranch<FolderDoc>(
    projectFolderUrl,
    repo
  );
  const doc = await folderHandle.doc();

  if (!doc) {
    console.error(`Could not find ${folderHandle.url}: ${folderHandle.state}`);
    process.exit(1);
  }

  // todo: handle nested folders
  await Promise.all(
    doc.docs.map(async (docLink) => {
      if (docLink.name === "jacquard.json") {
        return;
      }

      const fileHandle = await findWithActiveBranch<FileDoc>(docLink.url, repo);
      const fileDoc = await fileHandle.doc();

      // todo: handle other docs that are not files
      if (docLink.type !== "file") {
        console.log(`skip ${docLink.name}`);
        return;
      }

      fs.writeFileSync(path.join(dir, fileDoc.name), fileDoc.content);
    })
  );
}
