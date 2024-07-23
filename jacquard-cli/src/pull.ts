import fs from "fs";
import path from "path";
import { CommandLineArgs } from ".";
import { AutomergeUrl, Doc, Repo } from "@automerge/automerge-repo";
import { FolderDoc } from "@/packages/folder";
import { FileDoc } from "../../packages/file/src/datatype";
import { findWithActiveBranch } from "./findWithActiveBranch";

export async function pull(
  repo: Repo,
  { projectFolderUrl, dir }: CommandLineArgs
) {
  await pullFolder({ folderUrl: projectFolderUrl, dir, repo });
}

async function pullFolder({
  folderUrl,
  dir,
  repo,
}: {
  folderUrl: AutomergeUrl;
  dir: string;
  repo: Repo;
}) {
  const folderHandle = await findWithActiveBranch<FolderDoc>(folderUrl, repo);
  const doc = await folderHandle.doc();

  if (!doc) {
    console.error(`Could not find ${folderHandle.url}: ${folderHandle.state}`);
    process.exit(1);
  }

  await Promise.all(
    doc.docs.map(async (docLink) => {
      // skip jacquard.json
      if (docLink.name === "jacquard.json") {
        return;
      }

      switch (docLink.type) {
        case "file":
          await pullFile({ fileUrl: docLink.url, dir, repo });
          break;
        case "folder":
          await pullFolder({
            folderUrl: docLink.url,
            dir: path.join(dir, docLink.name),
            repo,
          });
          break;
        default:
          console.log(`skipping non-file doc: ${docLink.name}`);
          return;
      }
    })
  );
}

async function pullFile({
  fileUrl,
  dir,
  repo,
}: {
  fileUrl: AutomergeUrl;
  dir: string;
  repo: Repo;
}) {
  const fileHandle = await findWithActiveBranch<FileDoc>(fileUrl, repo);
  const fileDoc = await fileHandle.doc();

  if (!fileDoc) {
    console.error(`Could not find ${fileUrl}: ${fileHandle.state}`);
    return;
  }

  fs.writeFileSync(path.join(dir, fileDoc.name), fileDoc.content);
}
