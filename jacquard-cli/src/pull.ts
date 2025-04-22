import { FolderDoc } from "@patchwork/folder";
import { DocLink } from "@patchwork/sdk/router";
import {
  getDefaultExportMethodForDatatype,
  DataType,
  loadPlugin,
} from "@patchwork/sdk";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import fs from "fs/promises";
import path from "path";
import { CommandLineArgs } from ".";
import { omOnCLIActiveBranchPromise } from "./util";

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
  const folderOm = await omOnCLIActiveBranchPromise<FolderDoc>(folderUrl, repo);

  await Promise.all(
    folderOm.doc.docs.map(async (docLink) => {
      // skip jacquard.json
      if (docLink.name === "jacquard.json") {
        return;
      }

      if (docLink.type === "folder") {
        const newDir = path.join(dir, docLink.name);

        // Create the folder on disk if it doesn't exist
        await fs.mkdir(newDir, { recursive: true });

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

  const dataType = await loadPlugin<DataType>("patchwork:dataType", dataTypeId);

  if (!dataType) {
    console.error(`skipping doc ${filePath} - unknown type ${dataTypeId}`);
    return;
  }

  const exportMethod = getDefaultExportMethodForDatatype(dataType);
  if (!exportMethod) {
    console.error(
      `skipping doc ${filePath} - no export method found for ${dataTypeId}`
    );
    return;
  }

  const docOm = await omOnCLIActiveBranchPromise(docLink.url, repo);

  const file = await exportMethod.exportData(docOm.doc, repo);
  await fs.writeFile(
    path.join(dir, file.name),
    Buffer.from(await file.arrayBuffer())
  );
}
