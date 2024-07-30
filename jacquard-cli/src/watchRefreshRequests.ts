import {
  docReactiveSignal,
  getDoc,
  getOm,
  ifLoaded,
  parallelMap,
} from "@/doc-reactive";
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

  if (!projectFolder.docs || !Array.isArray(projectFolder.docs)) {
    throw new Error(
      `Looks like "${projectFolderUrl}" is not a folder document. It doesn't have a docs array`
    );
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

    if (!mainBuildMetadataOm) {
      console.log("skip has no build metadata");
      return [];
    }

    if (mainBuildMetadataOm.doc.refreshState?.type === "requesting") {
      pending.push({ buildMetadataOm: mainBuildMetadataOm });
    }

    if (!versionControlMetadataOm?.doc.isBranchScope) {
      console.log("skip check branches");
      return [];
    }

    console.log("check branches", versionControlMetadataOm.doc.branches.length);

    // check branches

    parallelMap(versionControlMetadataOm.doc.branches, (branchUrl) => {
      const branchBuildMetadataDocUrl = resolveUrlOnBranch(
        mainBuildMetadataOm.url,
        branchUrl,
        repo
      ).url;

      const branchBuildMetadataOm = getOm<JacquardBuildMetadata>(
        branchBuildMetadataDocUrl,
        repo
      );

      if (branchBuildMetadataOm.doc.refreshState?.type === "requesting") {
        pending.push({ buildMetadataOm: branchBuildMetadataOm, branchUrl });
      }
    });

    return pending;
  });

  console.log("waiting for requests ...");

  while (true) {
    const pending = ifLoaded(buildMetadataDocsWithPendingRefresh.value);
    const next = pending && pending[0];

    console.log("check");

    if (!next) {
      await sleep(500);
      continue;
    }

    console.log("switch to branch:", next.branchUrl ?? "main");

    await activateBranch(repo, {
      projectFolderUrl,
      dir,
      branchUrl: next.branchUrl,
    });

    console.log("done pull");

    await refresh(repo, {
      dir,
      projectFolderUrl,
      syncServerStorageId,
      patchworkUrl,
      onProgress: (buildRuns) => {
        next.buildMetadataOm.handle.change((doc) => {
          doc.refreshState = {
            type: "processing",
            buildRuns: JSON.parse(JSON.stringify(buildRuns)), // turn automerge object into POJO before assigning it back to the doc
          };
        });
      },
    });

    await sleep(500);

    console.log("refresh finished");

    next.buildMetadataOm.handle.change((doc) => {
      doc.refreshState = { type: "idle" };
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
