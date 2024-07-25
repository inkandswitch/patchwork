import { Repo } from "@automerge/automerge-repo";
import { CommandLineArgs } from ".";
import { refresh } from "./refresh";
import { FolderDoc } from "@/packages/folder";
import { JacquardBuildMetadata } from "../../packages/jacquard/src/datatype";
import { sleep } from "./util";
import { pull } from "./pull";

export async function watchRefreshRequests(
  repo: Repo,
  { dir, projectFolderUrl, syncServerStorageId, patchworkUrl }: CommandLineArgs
) {
  if (!projectFolderUrl) {
    console.log("No project folder URL provided.");
    return;
  }

  const projectFolderHandle = repo.find<FolderDoc>(projectFolderUrl);

  const projectFolder = await projectFolderHandle.doc();

  if (!projectFolder) {
    console.log("Failed to load project folder");
    return;
  }

  const metadataDocUrl = projectFolder.docs.find(
    (doc) => doc.type === "jacquard-build-metadata"
  )?.url;

  if (!metadataDocUrl) {
    console.log("Project has not build metadata file");
    return;
  }

  let activeRefresh: Promise<void> | undefined;

  // set to true if refresh is triggered while a previous refresh is still ongoing
  // this is needed because we can only run one refresh at a time right now
  // todo: allow to abort running refreshs
  let needsRefresh = false;

  const metadataDocHandle = repo.find<JacquardBuildMetadata>(metadataDocUrl);
  await metadataDocHandle.whenReady();

  console.log("waiting for requests ...");

  metadataDocHandle.on("change", async ({ doc }) => {
    if (doc.refreshState === "requesting") {
      triggerRefresh();
    }
  });

  const triggerRefresh = async () => {
    if (activeRefresh) {
      needsRefresh = true;
      return;
    }

    metadataDocHandle.change((doc) => {
      doc.refreshState = "processing";
    });

    console.log("\nrefresh started");

    console.log("pulling");
    await pull(repo, {
      dir,
      projectFolderUrl,
      syncServerStorageId,
      patchworkUrl,
    });
    console.log("done pull");

    activeRefresh = refresh(repo, {
      dir,
      projectFolderUrl,
      syncServerStorageId,
      patchworkUrl,
    });

    await activeRefresh;
    await sleep(500);

    activeRefresh = undefined;

    console.log("refresh finished");

    // check if we need to rerun refresh because a refresh was triggered
    if (needsRefresh) {
      triggerRefresh();
      return;
    }

    metadataDocHandle.change((doc) => {
      doc.refreshState = "idle";
    });
  };

  const metadataDoc = await metadataDocHandle.doc();

  if (
    metadataDoc?.refreshState === "requesting" ||
    metadataDoc?.refreshState === "processing"
  ) {
    triggerRefresh();
  }

  // wait indefinitely
  return await new Promise(() => {});
}
