import { FolderDoc } from "@/packages/folder";
import { VersionControlSidecarDoc } from "@/sdk";
import * as Automerge from "@automerge/automerge";
import { next as A } from "@automerge/automerge";
import {
  AutomergeUrl,
  DocHandle,
  Repo,
  parseAutomergeUrl,
  updateText,
} from "@automerge/automerge-repo";
import fs from "fs";
import mime from "mime-types";
import path from "path";
import process from "process";
import { CommandLineArgs } from ".";
import { FileDoc } from "../../packages/file/src/datatype";
import { JacquardBuildMetadata } from "../../packages/jacquard/src/datatype";
import { findWithActiveBranchPromise } from "./findWithActiveBranch";
import { BuildMetadata } from "./run";
import {
  formatFileSize,
  readFileContent,
  sha256,
  sleep,
  uploadFile,
  waitForSync,
} from "./util";

// NOTE: copied this from the version control code in our os folder.
// couldn't get imports working from os to jacquard-cli so just copying the function for now.
const initVersionControlMetadata = (
  doc: any,
  repo: Repo,
  options: { branchScope: boolean }
) => {
  doc.branchMetadata = {
    source: null,
    branches: [],
  };
  doc.discussions = {};
  doc.tags = [];
  doc.changeGroupSummaries = {};

  // init the separate metadata doc
  const metadataHandle = repo.create<VersionControlSidecarDoc>();
  if (options.branchScope) {
    ensureMetadataHandleIsBranchScope(metadataHandle);
  }
  doc.versionControlMetadataUrl = metadataHandle.url;
};

export async function push(
  repo: Repo,
  args: CommandLineArgs,
  buildMetadata?: BuildMetadata,
  wait = true
) {
  const { dir, projectFolderUrl, patchworkUrl, syncServerStorageId } = args;

  let folderHandle: DocHandle<FolderDoc> = await findOrCreateFolderHandle(
    projectFolderUrl,
    repo
  );

  const buildStuff: BuildStuff | undefined = buildMetadata && {
    buildMetadata,
    buildMetadataHandle: await findOrCreateBuildMetadataHandle(
      buildMetadata,
      folderHandle,
      repo
    ),
  };

  const mainUrlsAndCloneHandlesByFileName: Record<
    string,
    {
      mainUrl: AutomergeUrl;
      cloneHandle: DocHandle<FileDoc>;
    }
  > = {};

  const handlesToWaitOn: DocHandle<unknown>[] = [folderHandle];

  await pushDir({
    repo,
    dir,
    folderHandle,
    mainUrlsAndCloneHandlesByFileName,
    handlesToWaitOn,
    buildStuff,
  });

  if (buildStuff) {
    const { buildMetadata, buildMetadataHandle } = buildStuff;
    buildMetadataHandle.change((doc) => {
      doc.buildRuns.push({
        ...buildMetadata,
        inputs: buildMetadata.inputs.map((inputPath) => {
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
        outputs: buildMetadata.outputs.map((outputPath) => {
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
  }

  const { documentId } = parseAutomergeUrl(folderHandle.url);
  console.log(
    `View at: ${patchworkUrl}/#jacquard-project--${documentId}?type=folder`
  );

  if (wait) {
    await waitForSync(handlesToWaitOn, syncServerStorageId);
  }
}

type BuildStuff = {
  buildMetadata: BuildMetadata;
  buildMetadataHandle: DocHandle<JacquardBuildMetadata>;
};

// TODO put this in a config file
const IGNORE_FILES_ENDING_IN = [
  ".DS_Store",
  "__pycache__",
  ".git",
  ".mrg",
  ".pixi",
];

async function pushDir({
  dir,
  handlesToWaitOn,
  repo,
  mainUrlsAndCloneHandlesByFileName,
  folderHandle,
  buildStuff,
}: {
  dir: string;
  handlesToWaitOn: DocHandle<unknown>[];
  repo: Repo;
  mainUrlsAndCloneHandlesByFileName: Record<
    string,
    { mainUrl: AutomergeUrl; cloneHandle: DocHandle<FileDoc> }
  >;
  folderHandle: DocHandle<FolderDoc>;
  buildStuff?: BuildStuff;
}) {
  console.log(`Pushing dir: ${dir}`);

  const files = fs.readdirSync(dir);

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
        subFolderHandle = await findWithActiveBranchPromise<FolderDoc>(
          existingDocLink.url,
          repo
        );
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
        buildStuff,
      });
    } else {
      const { handle, mainUrl, didChange } = await pushFile({
        filePath,
        folderHandle,
        repo,
        buildStuff,
      });
      mainUrlsAndCloneHandlesByFileName[path.basename(filePath)] = {
        mainUrl: mainUrl,
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
    folderHandle = await findWithActiveBranchPromise<FolderDoc>(
      projectFolderUrl,
      repo
    );
    await folderHandle.doc();
    if (folderHandle.docSync() === undefined) {
      console.error(`Could not find doc at ${projectFolderUrl}`);
      process.exit(1);
    }
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
  buildMetadata: BuildMetadata,
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
    buildMetadataHandle =
      await findWithActiveBranchPromise<JacquardBuildMetadata>(
        buildMetadataDocUrl,
        repo
      );
    await buildMetadataHandle.whenReady();
  } else {
    buildMetadataHandle = repo.create();
    buildMetadataHandle.change((doc) => {
      doc.title = "Build Metadata";
      doc.buildRuns = [];
      doc.refreshState = { type: "idle" };
      // todo: find a better solution
      // in the build metadata viewer we need access to the project folder to compute
      // the build graph with staleness. Maybe the build metadata should be part of the folder?
      doc.projectFolderUrl = folderHandle.url;
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

// TODO: copied in from os/src/versionControl/schema.ts cuz importing it brings
// in TLDraw stuff that breaks our cute li'l bun
export const ensureMetadataHandleIsBranchScope = (
  handle: DocHandle<VersionControlSidecarDoc>
) => {
  handle.change((d) => {
    if (!d.isBranchScope) {
      // @ts-ignore
      d.isBranchScope = true;
      // @ts-expect-error TS not smart enough to figure this one out
      d.branches = [];
    }
  });
  return handle as DocHandle<
    VersionControlSidecarDoc & { isBranchScope: true }
  >;
};

const pushFile = async ({
  filePath,
  folderHandle,
  repo,
  buildStuff,
}: {
  filePath: string;
  folderHandle: DocHandle<FolderDoc>;
  repo: Repo;
  buildStuff?: BuildStuff;
}): Promise<{
  handle: DocHandle<FileDoc>;
  mainUrl: AutomergeUrl;
  didChange: boolean;
}> => {
  const fileContent = readFileContent(filePath);

  const fileSize = fs.statSync(filePath).size;
  const formattedSize = formatFileSize(fileSize);
  console.log(
    `Pushing ${fileContent.type} file (${formattedSize}): ${filePath}`
  );

  const fileType = path.extname(filePath).slice(1);
  const fileNameWithExtension = path.basename(filePath);

  const folderDoc = await folderHandle.doc();
  if (!folderDoc) {
    throw new Error(`Folder doc missing: ${folderHandle.url}`);
  }

  if (!folderDoc.docs) {
    throw new Error(
      `this doesn't look like a folder doc, it's missing a docs property: ${folderHandle.url}`
    );
  }

  const existingDocLink = folderDoc.docs.find(
    (link) => link.name === fileNameWithExtension
  );

  const changeMetadata =
    buildStuff &&
    buildStuff.buildMetadata.outputs.some(
      (o) => path.resolve(filePath) === path.resolve(o)
    )
      ? {
          buildDocUrl: buildStuff.buildMetadataHandle.url,
          buildId: buildStuff.buildMetadata.id,
        }
      : undefined;

  let handle: DocHandle<FileDoc>;
  let mainUrl: AutomergeUrl = undefined as any; // TODO: JAH strict fix - what happens if !existingDocLink below?
  let didChange = false;
  if (existingDocLink) {
    handle = await findWithActiveBranchPromise<FileDoc>(
      existingDocLink.url,
      repo
    );
    mainUrl = existingDocLink.url;

    await handle.whenReady();

    if (fileContent.type === "binary") {
      const doc = await handle.doc();
      if (!doc) {
        throw new Error(`Doc missing: ${handle.url}`);
      }
      const hash = sha256(fileContent.value);
      if (!(doc.content.type === "link" && doc.content.url.endsWith(hash))) {
        didChange = true;
        handle = await findWithActiveBranchPromise<FileDoc>(
          existingDocLink.url,
          repo
        );

        const mimeType = mime.lookup(fileType);
        console.log("File changed, uploading...");
        const url = await uploadFile(fileContent.value, mimeType);

        handle.change(
          (doc) => {
            doc.content = { type: "link", url };
          },
          {
            message: changeMetadata
              ? JSON.stringify(changeMetadata)
              : undefined,
          }
        );
      } else {
        console.log("File didn't change, skipping upload");
      }
    } else {
      // TODO: this is a datatype-specific mapping from unix file to automerge doc!
      // needs to be specified somewhere datatype-specific I guess.
      // notably: it's also an incremental update to support diffs.
      handle.change(
        (doc) => {
          if (!Automerge.equals(doc.content, fileContent)) {
            console.log("File changed, updating...");
            didChange = true;

            if (doc.content.type === "text") {
              updateText(doc, ["content", "value"], fileContent.value);
            } else {
              doc.content = fileContent;
            }
          } else {
            console.log("File didn't change, skipping update");
          }
        },
        {
          message: changeMetadata ? JSON.stringify(changeMetadata) : undefined,
        }
      );
    }
  } else {
    console.log("Creating new file...");
    // Make a new doc in the folder
    handle = repo.create();
    mainUrl = handle.url;
    didChange = true;

    // delay to not overload automerge repo by creating many handles
    sleep(500);

    let url: string | undefined = undefined;
    if (fileContent.type === "binary") {
      const mimeType = mime.lookup(fileType);
      url = await uploadFile(fileContent.value, mimeType);
    }

    handle.change(
      (doc) => {
        doc.name = path.basename(filePath);
        doc.type = fileType;

        if (url) {
          doc.content = { type: "link", url };
        } else {
          doc.content = fileContent;
        }

        // init patchwork metadata
        doc.branchMetadata = {
          source: null,
          branches: [],
        };
        doc.discussions = {};
        doc.tags = [];
        doc.changeGroupSummaries = {};
      },
      {
        message: changeMetadata ? JSON.stringify(changeMetadata) : undefined,
      }
    );

    folderHandle.change((d) => {
      d.docs.push({
        name: fileNameWithExtension,
        url: handle.url, // this is ok cuz it's a new doc, not a clone
        type: "file",
      });
    });
  }

  return { handle, mainUrl, didChange };
};
