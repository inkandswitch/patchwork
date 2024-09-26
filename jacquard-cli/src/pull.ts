import { DocLink, FolderDoc } from "@/packages/folder";
import { dataTypeById } from "@/sdk";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import fs from "fs";
import path from "path";
import { CommandLineArgs } from ".";
import { dataTypes, omOnActiveBranchPromise } from "./util";

export async function pull(repo: Repo, args: CommandLineArgs) {
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
  const folderOm = await omOnActiveBranchPromise<FolderDoc>(folderUrl, repo);

  await Promise.all(
    folderOm.doc.docs.map(async (docLink) => {
      // skip jacquard.json
      if (docLink.name === "jacquard.json") {
        return;
      }

      if (docLink.type === "folder") {
        const newDir = path.join(dir, docLink.name);

        // Create the folder on disk if it doesn't exist
        if (!fs.existsSync(newDir)) {
          fs.mkdirSync(newDir, { recursive: true });
        }

        // then pull the contents of the folder
        await pullFolder({
          folderUrl: docLink.url,
          dir: newDir,
          repo,
        });
      } else {
        await pullDoc({ docLink, dir, repo });
      }
    })
  );
}

async function pullDoc({
  docLink,
  dir,
  repo,
}: {
  docLink: DocLink;
  dir: string;
  repo: Repo;
}) {
  const dataTypeId = docLink.type;
  const filePath = path.join(dir, docLink.name);

  const dataType = dataTypeById(dataTypes, dataTypeId);
  if (!dataType) {
    console.error(`skipping doc ${filePath} with unknown type ${dataTypeId}`);
    return;
  }
  if (!dataType.docToUnixFile) {
    console.log(`skipping doc ${filePath} of non-file type ${dataTypeId}`);
    return;
  }

  const docOm = await omOnActiveBranchPromise(docLink.url, repo);

  const unixFile = await dataType.docToUnixFile(docOm.doc);
  fs.writeFileSync(
    unixFile.fileName ? path.join(dir, unixFile.fileName) : filePath,
    unixFile.content
  );
}
