import fs from "fs";
import path from "path";
import process from "process";
import * as Automerge from "@automerge/automerge";
import { isBinaryFileSync } from "isbinaryfile";
import { next as A } from "@automerge/automerge";
import {
  AutomergeUrl,
  DocHandle,
  Repo,
  parseAutomergeUrl,
  updateText,
} from "@automerge/automerge-repo";
import { CommandLineArgs } from ".";
import { BuildMetadata } from "./run";
import { FileDoc } from "../../packages/file/src/datatype";
import { MarkdownDoc } from "../../packages/essay/src";
import { FolderDoc } from "@/packages/folder";
import { JacquardBuildMetadata } from "../../packages/jacquard/src/datatype";
import { VersionControlSidecarDoc } from "@/sdk";
import { findWithActiveBranch } from "./findWithActiveBranch";
import { waitForSync } from "./util";

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
  { dir, projectFolderUrl, syncServerStorageId, patchworkUrl }: CommandLineArgs,
  buildMetadata?: BuildMetadata,
  wait = true
) {
  if (!projectFolderUrl) {
    console.log("No project folder URL provided.");
    return;
  }

  let folderHandle: DocHandle<FolderDoc> = await findOrCreateFolderHandle(
    projectFolderUrl,
    repo
  );

  // const oldHeads = A.getHeads(folderHandle.docSync());
  // console.log("oldHeads", oldHeads);

  const buildStuff: BuildStuff | undefined =
    buildMetadata && {
      buildMetadata,
      buildMetadataHandle: await findOrCreateBuildMetadataHandle(buildMetadata, folderHandle, repo),
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
          const { mainUrl, cloneHandle } =
            mainUrlsAndCloneHandlesByFileName[path.basename(inputPath)];
          return {
            docUrl: mainUrl,
            path: inputPath,
            heads: A.getHeads(cloneHandle.docSync()!),  // TODO: JAH strict fix
          };
        }),
        outputs: buildMetadata.outputs.map((outputPath) => {
          const { mainUrl, cloneHandle } =
            mainUrlsAndCloneHandlesByFileName[path.basename(outputPath)];
          return {
            docUrl: mainUrl,
            path: outputPath,
            heads: A.getHeads(cloneHandle.docSync()!),  // TODO: JAH strict fix
          };
        }),
      });
    });
    handlesToWaitOn.push(buildMetadataHandle!);
  }

  // const newHeads = A.getHeads(folderHandle.docSync());
  // console.log("newHeads", newHeads);

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
}

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
  const files = fs.readdirSync(dir);

  for (const filePath of files.map((file) => path.join(dir, file))) {
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
        subFolderHandle = await findWithActiveBranch<FolderDoc>(
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

async function findOrCreateFolderHandle(projectFolderUrl: AutomergeUrl, repo: Repo) {
  let folderHandle: DocHandle<FolderDoc>;
  if (projectFolderUrl !== undefined) {
    folderHandle = await findWithActiveBranch<FolderDoc>(
      projectFolderUrl,
      repo
    );
    await folderHandle.doc();
    if (folderHandle.docSync() === undefined) {
      console.error(`Could not find doc at ${projectFolderUrl}`);
      process.exit(1);
    }
  } else {
    folderHandle = repo.create();
    folderHandle.change((d) => {
      d.title = "Jacquard folder";
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
    buildMetadataHandle = await findWithActiveBranch<JacquardBuildMetadata>(
      buildMetadataDocUrl,
      repo
    );
    await buildMetadataHandle.whenReady();
  } else {
    buildMetadataHandle = repo.create();
    buildMetadataHandle.change((doc) => {
      doc.title = "Build Metadata";
      doc.buildRuns = [];
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
  const isBinary = isBinaryFileSync(filePath);
  const isMarkdown = path.extname(filePath) === "md";

  const fileContents = fs.readFileSync(
    filePath,
    !isBinary ? "utf8" : undefined
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
      ? { buildDocUrl: buildStuff.buildMetadataHandle.url, buildId: buildStuff.buildMetadata.id }
      : undefined;

  let handle: DocHandle<FileDoc>;
  let mainUrl: AutomergeUrl = undefined as any;  // TODO: JAH strict fix - what happens if !existingDocLink below?
  let didChange = false;
  if (existingDocLink) {
    handle = await findWithActiveBranch<FileDoc>(existingDocLink.url, repo);
    mainUrl = existingDocLink.url;

    await handle.whenReady();

    // TODO: this is a datatype-specific mapping from unix file to automerge doc!
    // needs to be specified somewhere datatype-specific I guess.
    // notably: it's also an incremental update to support diffs.
    handle.change(
      (doc) => {
        if (!Automerge.equals(doc.content, fileContents)) {
          didChange = true;
          if (typeof fileContents === "string") {
            updateText(doc, ["content"], fileContents);
          } else {
            doc.content = fileContents;
          }
        }
      },
      {
        message: changeMetadata ? JSON.stringify(changeMetadata) : undefined,
      }
    );
  } else {
    // Make a new doc in the folder
    handle = repo.create();
    didChange = true;

    await handle.whenReady();

    // do some special handling for markdown
    // todo: import markdown as regular text files
    if (isMarkdown) {
      (handle as DocHandle<MarkdownDoc>).change(
        (doc) => {
          // init datatype schema
          doc.content = fileContents as string;  // TODO: JAH strict fix - what if it's a Buffer?
          doc.discussions = {};

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
    } else {
      (handle as DocHandle<FileDoc>).change(
        (doc) => {
          doc.name = path.basename(filePath);
          // todo: maybe convert type to generic id independent of file extensions
          doc.type = fileType;
          doc.content = fileContents;

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
    }

    console.log("push", filePath, Automerge.getHeads(handle.docSync()!));  // TODO: JAH strict fix

    folderHandle.change((d) => {
      d.docs.push({
        name: fileNameWithExtension,
        url: handle.url, // this is ok cuz it's a new doc, not a clone
        type: isMarkdown ? "essay" : "file",
      });
    });
  }

  return { handle, mainUrl, didChange };
};
