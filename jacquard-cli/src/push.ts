import { initFrom } from "@patchwork/sdk";
import { FolderDoc } from "@patchwork/folder";
import { initVersionControlMetadata } from "@patchwork/sdk/versionControl";
import * as Automerge from "@automerge/automerge";
import {
  AutomergeUrl,
  DocHandle,
  Repo,
  StorageId,
  parseAutomergeUrl,
} from "@automerge/automerge-repo";
import fs from "fs";
import path from "path";
import process from "process";
import { CommandLineArgs } from ".";
import { JacquardBuildMetadata } from "@patchwork/jacquard";
import { RunResult } from "./run";
import {
  formatFileSize,
  omOnCLIActiveBranchPromise,
  waitForSync,
  getStoredParentFolderUrl,
} from "./util";
import debugFactory from "debug";
import { fileTypeFromBuffer } from "file-type";
import { Mime } from "mime";
import { isBinaryCheck } from "@patchwork/file";
import standardTypes from "mime/types/standard.js";
import otherTypes from "mime/types/other.js";
import { createDocFromFile, updateDocFromFile } from "@patchwork/sdk/files";

// This is mostly because .ts is otherwise interpreted as a video file
// the 'text/tsx' is for consistency with .jsx files in 'mime'.
// We might consider adding an automerge type in the future but I have not done so here.
// This could also be extensible via dataTypes but... again, I'm just fixing an immediate issue.
const mime = new Mime(standardTypes, otherTypes);
mime.define(
  {
    "text/typescript": ["ts"],
    "text/tsx": ["tsx"],
  },
  true
);

const debug = debugFactory("jacquard-cli:push");

export async function push(
  repo: Repo,
  args: CommandLineArgs,
  /** Is this push coming after a run? If so, put the run result here so it can
   * be uploaded. */
  runResult?: RunResult,
  wait = true
) {
  console.log("pushing");
  const {
    dir,
    projectFolderUrl,
    patchworkUrl,
    syncServerStorageId,
    parentFolderUrl,
  } = args;

  let folderHandle: DocHandle<FolderDoc> = await findOrCreateFolderHandle(
    projectFolderUrl,
    repo
  );

  console.log(`pushing to folder: ${folderHandle.url}`);

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
    syncServerStorageId,
  });

  if (runResult) {
    const buildMetadataHandle = await findOrCreateBuildMetadataHandle(
      folderHandle,
      repo
    );
    buildMetadataHandle.change((doc) => {
      doc.buildRuns.push({
        id: crypto.randomUUID(),
        spec: runResult.spec,
        timestamp: runResult.timestamp,
        duration: runResult.duration,
        inputs: runResult.inputs.map((inputPath) => {
          const info =
            mainUrlsAndCloneHandlesByFileName[path.basename(inputPath)];
          if (!info) {
            throw new Error(`Could not find info for input ${inputPath}`);
          }
          const { mainUrl, cloneHandle } = info;
          return {
            docUrl: mainUrl,
            path: inputPath,
            heads: cloneHandle.heads(),
          };
        }),
        outputs: runResult.outputs.map((outputPath) => {
          const info =
            mainUrlsAndCloneHandlesByFileName[path.basename(outputPath)];
          if (!info) {
            throw new Error(`Could not find info for output ${outputPath}`);
          }
          const { mainUrl, cloneHandle } = info;
          return {
            docUrl: mainUrl,
            path: outputPath,
            heads: cloneHandle.heads(),
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

    // Use command line arg if provided, otherwise fall back to stored value
    const targetParentFolderUrl = parentFolderUrl || getStoredParentFolderUrl();
    if (targetParentFolderUrl) {
      const parentFolderHandle = await repo.find<FolderDoc>(
        targetParentFolderUrl
      );
      const folderDoc = folderHandle.doc();
      if (!folderDoc) {
        // Skip if folder doc not found
        return;
      }

      parentFolderHandle.change((doc) => {
        doc.docs.unshift({
          name: folderDoc.title,
          url: folderHandle.url,
          type: "folder",
        });
      });

      console.log(`Added to parent folder at ${targetParentFolderUrl}`);
    }
  }

  const { documentId } = parseAutomergeUrl(folderHandle.url);
  console.log(
    `  View at: ${patchworkUrl}/#jacquard-project--${documentId}?type=folder`
  );

  if (handlesToWaitOn.length > 1) {
    folderHandle.change((d: any) => {
      // XXX HACK: this forces a change to the root folder which should trigger a code reload
      d.lastPush = Date.now();
    });
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
  syncServerStorageId,
  mainUrlsAndCloneHandlesByFileName,
  folderHandle,
}: {
  dir: string;
  handlesToWaitOn: DocHandle<unknown>[];
  repo: Repo;
  syncServerStorageId: StorageId | undefined;
  mainUrlsAndCloneHandlesByFileName: Record<
    string,
    { mainUrl: AutomergeUrl; cloneHandle: DocHandle<unknown> }
  >;
  folderHandle: DocHandle<FolderDoc>;
}) {
  debug(`Pushing dir: ${dir}`);

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
        syncServerStorageId,
        mainUrlsAndCloneHandlesByFileName,
        folderHandle: subFolderHandle,
      });
    } else {
      const { handle, mainUrl, didChange } = await pushFile({
        filePath,
        folderHandle,
        repo,
        syncServerStorageId,
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
    debug(`Created new folder: ${folderHandle.url}`);
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
  const folderDoc = folderHandle.doc();
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
  syncServerStorageId,
}: {
  filePath: string;
  folderHandle: DocHandle<FolderDoc>;
  repo: Repo;
  syncServerStorageId: StorageId | undefined;
}): Promise<{
  handle: DocHandle<unknown>;
  mainUrl: AutomergeUrl;
  didChange: boolean;
}> => {
  console.log("pushing file: ", filePath);
  const fileSize = fs.statSync(filePath).size;
  const formattedSize = formatFileSize(fileSize);
  debug(`Pushing file (${formattedSize}): ${filePath}`);

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

  /* Load the file from disk into a File object */
  const buffer = fs.readFileSync(filePath);
  const isBinary = isBinaryCheck(buffer, buffer.length);
  const mimeType = isBinary
    ? (await fileTypeFromBuffer(buffer))?.mime ?? "application/octet-stream"
    : mime.getType(path.extname(filePath).slice(1)) ?? "text/plain";

  const file = new File([buffer], fileName, { type: mimeType });

  let handle: DocHandle<unknown>;
  let didChange: boolean;

  if (existingDocLink) {
    handle = (await omOnCLIActiveBranchPromise(existingDocLink.url, repo))
      .handle;
    ({ didChange } = await updateDocFromFile(file, handle));
  } else {
    handle = await createDocFromFile(file, repo);
    didChange = true; // New doc always counts as a change
    const newDoc = handle.doc() as Automerge.Doc<HasPatchworkMetadata>;
    const dataTypeId = newDoc["@patchwork"].type;

    folderHandle.change((d) => {
      d.docs.push({
        name: fileName,
        url: handle.url,
        type: dataTypeId,
      });
    });
  }

  // wait for the sync to complete to not overload automerge repo by creating many handles at once
  await waitForSync([handle], syncServerStorageId);

  return { handle, mainUrl: handle.url, didChange };
};
