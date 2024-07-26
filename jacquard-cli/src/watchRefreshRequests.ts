import { docReactiveSignal, getDoc, getOm, ifLoaded } from "@/doc-reactive";
import { Om } from "@/om";
import { FolderDoc } from "@/packages/folder";
import {
  getVersionControlMetadataOm,
  resolveUrlOnBranch,
} from "@/versionControl/signals";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { CommandLineArgs } from ".";
import { JacquardBuildMetadata } from "../../packages/jacquard/src/datatype";
import { activateBranch } from "./activate";
import { pull } from "./pull";
import { refresh } from "./refresh";
import { sleep } from "./util";

type BuildMetadataDocWithBranchUrl = {
  branchUrl?: AutomergeUrl;
  buildMetadataOm: Om<JacquardBuildMetadata>;
};

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
  const buildMetadataDocsWithPendingRefresh = docReactiveSignal<
    BuildMetadataDocWithBranchUrl[]
  >(() => {
    const projectFolder = getDoc<FolderDoc>(projectFolderHandle.url, repo);

    const versionControlMetadataOm = getVersionControlMetadataOm(
      projectFolder,
      repo
    );

    const pending: BuildMetadataDocWithBranchUrl[] = [];

    // check build metadata on main
    const mainBuildMetadataOm = getBuildMetadataOmOfFolder(projectFolder, repo);
    if (
      mainBuildMetadataOm &&
      mainBuildMetadataOm.doc.refreshState === "requesting"
    ) {
      pending.push({ buildMetadataOm: mainBuildMetadataOm });
    }

    if (!versionControlMetadataOm?.doc.isBranchScope) {
      return [];
    }

    // check branches
    for (const branchUrl of versionControlMetadataOm.doc.branches) {
      const branchBuildMetadataDocUrl = resolveUrlOnBranch(
        versionControlMetadataOm.url,
        branchUrl,
        repo
      ).url;

      const branchBuildMetadataOm = getOm<JacquardBuildMetadata>(
        branchBuildMetadataDocUrl,
        repo
      );

      if (branchBuildMetadataOm.doc.refreshState === "requesting") {
        pending.push({ buildMetadataOm: branchBuildMetadataOm, branchUrl });
      }
    }

    return pending;
  });

  console.log("waiting for requests ...");

  while (true) {
    const pending = ifLoaded(buildMetadataDocsWithPendingRefresh.value);
    const next = pending && pending[0];

    if (!next) {
      await sleep(500);
      continue;
    }

    next.buildMetadataOm.handle.change((doc) => {
      doc.refreshState = "processing";
    });

    console.log("\nrefresh started");

    console.log("switch to branch:", next.branchUrl ?? "main");

    await activateBranch(repo, {
      projectFolderUrl,
      dir,
      branchUrl: next.branchUrl,
    });

    console.log("pulling");
    ``;
    await pull(repo, {
      dir,
      projectFolderUrl,
      syncServerStorageId,
      patchworkUrl,
    });
    console.log("done pull");

    await refresh(repo, {
      dir,
      projectFolderUrl,
      syncServerStorageId,
      patchworkUrl,
    });

    await sleep(500);

    console.log("refresh finished");

    next.buildMetadataOm.handle.change((doc) => {
      doc.refreshState = "idle";
    });
  }
}

const getBuildMetadataOmOfFolder = (projectFolder: FolderDoc, repo: Repo) => {
  const buildMetadataDocLink = projectFolder.docs.find(
    (docLink) => docLink.type === "jacquard-build-metadata"
  );

  if (!buildMetadataDocLink) {
    return;
  }

  return getOm<JacquardBuildMetadata>(buildMetadataDocLink.url, repo);
};
