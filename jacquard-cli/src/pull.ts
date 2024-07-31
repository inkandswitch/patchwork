import { FolderDoc } from "@/packages/folder";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import fs from "fs";
import path from "path";
import { CommandLineArgs } from ".";
import { FileDoc } from "../../packages/file/src/datatype";
import { findWithActiveBranchPromise } from "./findWithActiveBranch";
import { fetchFile } from "./util";

export async function pull(
  repo: Repo,
  args: CommandLineArgs
) {
  const { projectFolderUrl, dir } = args;

  if (!projectFolderUrl) {
    console.log("No project folder URL provided.");
    return;
  }
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
  const folderHandle = await findWithActiveBranchPromise<FolderDoc>(folderUrl, repo);
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
          // Create the folder on disk if it doesn't exist
          if (!fs.existsSync(path.join(dir, docLink.name))) {
            fs.mkdirSync(path.join(dir, docLink.name), { recursive: true });
          }

          // then pull the contents of the folder
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
  const fileHandle = await findWithActiveBranchPromise<FileDoc>(fileUrl, repo);
  const fileDoc = await fileHandle.doc();

  if (!fileDoc) {
    console.error(`Could not find ${fileUrl}: ${fileHandle.state}`);
    return;
  }

  const content =
    fileDoc.content.type === "link"
      ? await fetchFile(fileDoc.content.url)
      : fileDoc.content.value;

  fs.writeFileSync(path.join(dir, fileDoc.name), content);
}
