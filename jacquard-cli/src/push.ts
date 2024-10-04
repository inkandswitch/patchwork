import { dataTypeById, initFrom } from "@/datatypes";
import { FolderDoc } from "@/packages/folder";
import { initVersionControlMetadata } from "@/versionControl/schema.ts";
import * as Automerge from "@automerge/automerge";
import { next as A } from "@automerge/automerge";
import {
  AutomergeUrl,
  DocHandle,
  Repo,
  parseAutomergeUrl,
} from "@automerge/automerge-repo";
import fs from "fs";
import path from "path";
import process from "process";
import { CommandLineArgs } from ".";
import { JacquardBuildMetadata } from "../../packages/jacquard/src/datatype";
import { RunResult } from "./run";
import {
  dataTypes,
  formatFileSize,
  omOnCLIActiveBranchPromise,
  readFileContent,
  sleep,
  waitForSync,
} from "./util";

export async function push(
  repo: Repo,
  args: CommandLineArgs,
  /** Is this push coming after a run? If so, put the run result here so it can
   * be uploaded. */
  runResult?: RunResult,
  wait = true
) {
  const { dir, projectFolderUrl, patchworkUrl, syncServerStorageId } = args;

  let folderHandle: DocHandle<FolderDoc> = await findOrCreateFolderHandle(
    projectFolderUrl,
    repo
  );

  const mainUrlsAndCloneHandlesByFileName: Record<
    string,
    {
      mainUrl: AutomergeUrl;
      cloneHandle: DocHandle<unknown>;
    }
  > = {};

  const handlesToWaitOn: DocHandle<unknown>[] = [folderHandle];

  await pushDir({
    repo,
    dir,
    folderHandle,
    mainUrlsAndCloneHandlesByFileName,
    handlesToWaitOn,
  });

  if (runResult) {
    const buildMetadataHandle = await findOrCreateBuildMetadataHandle(
      folderHandle,
      repo
    );
    buildMetadataHandle.change((doc) => {
      doc.buildRuns.push({
        id: Automerge.uuid(),
        spec: runResult.spec,
        timestamp: runResult.timestamp,
        duration: runResult.duration,
        inputs: runResult.inputs.map((inputPath) => {
          console.log({
            inputPath,
          });
          const { mainUrl, cloneHandle } =
            mainUrlsAndCloneHandlesByFileName[path.basename(inputPath)];
          return {
            docUrl: mainUrl,
            path: inputPath,
            heads: A.getHeads(cloneHandle.docSync()!), // TODO: JAH strict fix
          };
        }),
        outputs: runResult.outputs.map((outputPath) => {
          const { mainUrl, cloneHandle } =
            mainUrlsAndCloneHandlesByFileName[path.basename(outputPath)];
          return {
            docUrl: mainUrl,
            path: outputPath,
            heads: A.getHeads(cloneHandle.docSync()!), // TODO: JAH strict fix
          };
        }),
      });
    });
    handlesToWaitOn.push(buildMetadataHandle!);
  }

  if (projectFolderUrl) {
    console.log(`Updated files in existing folder ${projectFolderUrl}`);
  } else {
    console.log(`Created new folder at ${folderHandle.url}`);
    const { documentId } = parseAutomergeUrl(folderHandle.url);
    console.log(
      `  View at: ${patchworkUrl}/#jacquard-project--${documentId}?type=folder`
    );
  }

  if (wait) {
    await waitForSync(handlesToWaitOn, syncServerStorageId);
  }
}

// TODO put this in a config file
const IGNORE_FILES_ENDING_IN = [
  ".DS_Store",
  "__pycache__",
  ".git",
  ".mrg",
  ".pixi",
  "node_modules",
  ".temp", // living-papers
  ".cache", // living-papers
  ".jacquard",
  ".env",
];

async function pushDir({
  dir,
  handlesToWaitOn,
  repo,
  mainUrlsAndCloneHandlesByFileName,
  folderHandle,
}: {
  dir: string;
  handlesToWaitOn: DocHandle<unknown>[];
  repo: Repo;
  mainUrlsAndCloneHandlesByFileName: Record<
    string,
    { mainUrl: AutomergeUrl; cloneHandle: DocHandle<unknown> }
  >;
  folderHandle: DocHandle<FolderDoc>;
}) {
  console.log(`Pushing dir: ${dir}`);

  const files = fs.readdirSync(dir).sort();

  for (const filePath of files.map((file) => path.join(dir, file))) {
    // TODO: do this in a more principled way
    if (IGNORE_FILES_ENDING_IN.some((ignore) => filePath.endsWith(ignore))) {
      continue;
    }

    // For a directory, recursively push
    if (fs.lstatSync(filePath).isDirectory()) {
      const folderDoc = await folderHandle.doc();
      if (!folderDoc) {
        throw new Error(`Folder doc missing: ${folderDoc}`);
      }
      const existingDocLink = folderDoc.docs.find(
        (link) => link.name === path.basename(filePath)
      );
      let subFolderHandle: DocHandle<FolderDoc>;
      if (existingDocLink) {
        subFolderHandle = (
          await omOnCLIActiveBranchPromise<FolderDoc>(existingDocLink.url, repo)
        ).handle;
      } else {
        subFolderHandle = repo.create<FolderDoc>();
        subFolderHandle.change((doc) => {
          doc.title = path.basename(filePath);
          doc.docs = [];
          initVersionControlMetadata(doc, repo, { branchScope: false });
        });
        folderHandle.change((d) => {
          d.docs.push({
            name: path.basename(filePath),
            url: subFolderHandle.url,
            type: "folder",
          });
        });
      }
      await pushDir({
        dir: filePath,
        handlesToWaitOn,
        repo,
        mainUrlsAndCloneHandlesByFileName,
        folderHandle: subFolderHandle,
      });
    } else {
      const { handle, mainUrl, didChange } = await pushFile({
        filePath,
        folderHandle,
        repo,
      });
      mainUrlsAndCloneHandlesByFileName[path.basename(filePath)] = {
        mainUrl,
        cloneHandle: handle,
      };
      if (didChange) {
        handlesToWaitOn.push(handle);
      }
    }
  }
}

async function findOrCreateFolderHandle(
  projectFolderUrl: AutomergeUrl | undefined,
  repo: Repo
) {
  let folderHandle: DocHandle<FolderDoc>;
  if (projectFolderUrl !== undefined) {
    folderHandle = (
      await omOnCLIActiveBranchPromise<FolderDoc>(projectFolderUrl, repo)
    ).handle;
  } else {
    // assign a folder name based on the local FS name for this folder
    const projectName = path.basename(process.cwd());

    folderHandle = repo.create();
    console.log(`Created new folder: ${folderHandle.url}`);
    folderHandle.change((d) => {
      d.title = projectName;
      d.docs = [];
      initVersionControlMetadata(d, repo, { branchScope: true });
    });
    fs.writeFileSync(
      "jacquard.json",
      JSON.stringify({ projectFolderUrl: folderHandle.url })
    );
  }
  return folderHandle;
}

async function findOrCreateBuildMetadataHandle(
  folderHandle: DocHandle<FolderDoc>,
  repo: Repo
) {
  let buildMetadataHandle: DocHandle<JacquardBuildMetadata>;

  // TODO: feels weird to ID the build metadata doc by name like this
  const folderDoc = folderHandle.docSync();
  if (!folderDoc) {
    throw new Error(`Folder doc missing: ${folderHandle.url}`);
  }

  if (!folderDoc.docs) {
    throw new Error(
      "seems like the passed in automerge doc url doesn't point to a folder"
    );
  }

  const buildMetadataDocUrl = folderDoc.docs.find(
    (link) => link.name === "Build Metadata"
  )?.url;

  if (buildMetadataDocUrl) {
    buildMetadataHandle = (
      await omOnCLIActiveBranchPromise<JacquardBuildMetadata>(
        buildMetadataDocUrl,
        repo
      )
    ).handle;
    await buildMetadataHandle.whenReady();
  } else {
    buildMetadataHandle = repo.create();
    buildMetadataHandle.change((doc) => {
      initFrom(doc, {
        title: "Build Metadata",
        buildRuns: [],
        refreshState: { type: "idle" },
        // todo: find a better solution
        // in the build metadata viewer we need access to the project folder to compute
        // the build graph with staleness. Maybe the build metadata should be part of the folder?
        projectFolderUrl: folderHandle.url,
      });
    });
    folderHandle.change((d) => {
      d.docs.push({
        name: "Build Metadata",
        url: buildMetadataHandle.url,
        type: "jacquard-build-metadata",
      });
    });
  }
  return buildMetadataHandle;
}

const pushFile = async ({
  filePath,
  folderHandle,
  repo,
}: {
  filePath: string;
  folderHandle: DocHandle<FolderDoc>;
  repo: Repo;
}): Promise<{
  handle: DocHandle<unknown>;
  mainUrl: AutomergeUrl;
  didChange: boolean;
}> => {
  const fileContent = readFileContent(filePath);

  const fileSize = fs.statSync(filePath).size;
  const formattedSize = formatFileSize(fileSize);
  console.log(
    `Pushing ${fileContent.type} file (${formattedSize}): ${filePath}`
  );

  const fileExtension = path.extname(filePath).slice(1);
  const fileName = path.basename(filePath);

  const folderDoc = await folderHandle.doc();
  if (!folderDoc) {
    throw new Error(`Folder doc missing: ${folderHandle.url}`);
  }

  if (!folderDoc.docs) {
    throw new Error(
      `this doesn't look like a folder doc, it's missing a docs property: ${folderHandle.url}`
    );
  }

  const existingDocLink = folderDoc.docs.find((link) => link.name === fileName);

  if (existingDocLink) {
    const handle = (await omOnCLIActiveBranchPromise(existingDocLink.url, repo))
      .handle;
    const mainUrl = existingDocLink.url;

    const dataTypeId = existingDocLink.type;
    const dataType = dataTypeById(dataTypes, dataTypeId);
    if (!dataType) {
      throw new Error(
        `cannot update ${filePath} with unknown type ${dataTypeId}`
      );
    }
    if (!dataType.updateDocFromUnixFile) {
      throw new Error(
        `cannot update ${filePath} of non-file type ${dataTypeId}`
      );
    }

    const { didChange } = await dataType.updateDocFromUnixFile(
      fileContent.value,
      handle
    );

    return { handle, mainUrl, didChange };
  } else {
    console.log("Creating new file...");

    const dataType =
      dataTypes.find((dt) => dt.unixFileExtensions?.includes(fileExtension)) ??
      dataTypes.find((dt) => dt.unixFileExtensions?.includes("*"));

    if (!dataType) {
      throw new Error(`Unable to find datatype for ${fileExtension} or *`);
    }
    if (!dataType.initDocFromUnixFile) {
      throw new Error(
        `datatype ${dataType.id} does not have initDocFromUnixFile`
      );
    }

    // Make a new doc in the folder
    const handle = repo.create();
    await dataType.initDocFromUnixFile(fileContent.value, fileName, handle);
    const mainUrl = handle.url;
    const didChange = true;

    // delay to not overload automerge repo by creating many handles
    sleep(500);

    folderHandle.change((d) => {
      d.docs.push({
        name: fileName,
        url: handle.url, // this is ok cuz it's a new doc, not a clone
        type: dataType.id,
      });
    });

    return { handle, mainUrl, didChange };
  }
};
