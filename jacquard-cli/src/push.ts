import fs from "fs";
import path from "path";
import process from "process";
import * as Automerge from "@automerge/automerge";
import { isBinaryFileSync } from "isbinaryfile";
import { next as A } from "@automerge/automerge";
import {
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

export async function push(
  repo: Repo,
  { dir, automergeDocUrl, syncServerStorageId, patchworkUrl }: CommandLineArgs,
  buildMetadata?: BuildMetadata
) {
  let folderHandle: DocHandle<FolderDoc>;
  if (automergeDocUrl !== undefined) {
    folderHandle = repo.find(automergeDocUrl);
    await folderHandle.doc();
    if (folderHandle.docSync() === undefined) {
      console.error(`Could not find doc at ${automergeDocUrl}`);
      process.exit(1);
    }
  } else {
    folderHandle = repo.create();
    folderHandle.change((d) => {
      d.title = "Jacquard folder";
      d.docs = [];
    });
  }

  console.log("folder", folderHandle.url);

  const oldHeads = A.getHeads(folderHandle.docSync());
  console.log("oldHeads", oldHeads);

  const files = fs.readdirSync(dir);

  let buildMetadataHandle;
  // if build metadata was passed into the push, update the build metadata doc
  if (buildMetadata) {
    // TODO: feels weird to ID the build metadata doc by name like this
    const folderDoc = folderHandle.docSync();

    if (!folderDoc.docs) {
      throw new Error(
        "seems like the passed in automerge doc url doesn't point to a folder"
      );
    }

    const buildMetadataDocUrl = folderDoc.docs.find(
      (link) => link.name === "Build Metadata"
    )?.url;

    if (buildMetadataDocUrl) {
      buildMetadataHandle = repo.find(buildMetadataDocUrl);
      await buildMetadataHandle.whenReady();
    } else {
      buildMetadataHandle = repo.create();
      buildMetadataHandle.change((doc) => {
        doc.title = "Build Metadata";
        doc.buildRuns = [];
      });
      folderHandle.change((d) => {
        d.docs.push({
          name: "Build Metadata",
          url: buildMetadataHandle.url,
          type: "jacquard-build-metadata",
        });
      });
    }
  }

  const fileHandlesByFileName = {};

  for (const filePath of files) {
    // todo: sync subfolders
    if (fs.lstatSync(filePath).isDirectory()) {
      continue;
    }

    const isBinary = isBinaryFileSync(filePath);
    const isMarkdown = path.extname(filePath) === "md";

    const fileContents = fs.readFileSync(
      filePath,
      !isBinary ? "utf8" : undefined
    );
    const fileType = path.extname(filePath).slice(1);
    const fileNameWithExtension = path.basename(filePath);

    const existingDocLink = folderHandle
      .docSync()
      .docs.find((link) => link.name === fileNameWithExtension);

    const changeMetadata =
      buildMetadata &&
      buildMetadata.outputs.some(
        (o) => path.resolve(filePath) === path.resolve(o)
      )
        ? { buildDocUrl: buildMetadataHandle.url, buildId: buildMetadata.id }
        : undefined;

    if (existingDocLink) {
      const handle = repo.find<FileDoc>(existingDocLink.url);
      fileHandlesByFileName[fileNameWithExtension] = handle;

      await handle.whenReady();

      // TODO: this is a datatype-specific mapping from unix file to automerge doc!
      // needs to be specified somewhere datatype-specific I guess.
      // notably: it's also an incremental update to support diffs.
      handle.change(
        (doc) => {
          if (!Automerge.equals(doc.content, fileContents)) {
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
      const handle = repo.create<unknown>();
      fileHandlesByFileName[fileNameWithExtension] = handle;

      await handle.whenReady();

      // do some special handling for markdown
      // todo: import markdown as regular text files
      if (isMarkdown) {
        (handle as DocHandle<MarkdownDoc>).change(
          (doc) => {
            // init datatype schema
            doc.content = fileContents;
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
            message: changeMetadata
              ? JSON.stringify(changeMetadata)
              : undefined,
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
            message: changeMetadata
              ? JSON.stringify(changeMetadata)
              : undefined,
          }
        );
      }

      folderHandle.change((d) => {
        d.docs.push({
          name: filePath,
          url: handle.url,
          type: isMarkdown ? "essay" : "file",
        });
      });
    }
  }

  if (buildMetadata) {
    buildMetadataHandle.change((doc) => {
      doc.buildRuns.push({
        ...buildMetadata,
        inputs: buildMetadata.inputs.map((inputPath) => {
          const handle = fileHandlesByFileName[path.basename(inputPath)];
          return {
            docUrl: handle.url,
            path: inputPath,
            heads: A.getHeads(handle.docSync()),
          };
        }),
        outputs: buildMetadata.outputs.map((outputPath) => {
          const handle = fileHandlesByFileName[path.basename(outputPath)];
          return {
            docUrl: handle.url,
            path: outputPath,
            heads: A.getHeads(handle.docSync()),
          };
        }),
      });
    });
  }

  const newHeads = A.getHeads(folderHandle.docSync());
  console.log("newHeads", newHeads);

  const isSynced = new Promise((resolve) =>
    folderHandle.on("remote-heads", ({ storageId, heads }) => {
      if (storageId === syncServerStorageId && A.equals(newHeads, heads)) {
        resolve(true);
      }
    })
  );

  if (automergeDocUrl) {
    console.log(`Updated ${automergeDocUrl} with new contents.`);
  } else {
    console.log(`Created new doc at ${folderHandle.url}`);
  }

  console.log("Waiting for changes to sync...");

  const { documentId } = parseAutomergeUrl(folderHandle.url);
  console.log(
    `View at: ${patchworkUrl}/#jacquard-project--${documentId}?type=folder`
  );

  console.log("waiting");
  // todo: adapt isSynced to handle multiple documents
  // right now we are waiting forever
  await new Promise(() => {});

  //await isSynced;
}
