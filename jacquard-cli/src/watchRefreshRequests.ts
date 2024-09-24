import { asyncComputed, getDoc, getOm, parallelMap } from "@/async-signals";
import { Om } from "@/om";
import { FolderDoc } from "@/packages/folder";
import {
  getVersionControlMetadataOm,
  resolveUrlOnBranch,
} from "@/versionControl/signals";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import os from "node:os";
import { CommandLineArgs } from ".";
import { JacquardBuildMetadata } from "../../packages/jacquard/src/datatype";
import { activateBranch } from "./activate";
import { refresh } from "./refresh";
import { sleep } from "./util";

type BuildMetadataDocWithBranchUrl = {
  branchUrl?: AutomergeUrl;
  buildMetadataOm: Om<JacquardBuildMetadata>;
};

export async function watchRefreshRequests(repo: Repo, args: CommandLineArgs) {
  const { projectFolderUrl } = args;

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

  const buildMetadataDocsWithPendingRefresh = asyncComputed<
    BuildMetadataDocWithBranchUrl[]
  >("", () => {
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
    const pending =
      buildMetadataDocsWithPendingRefresh.value.ifPending(undefined);
    const next = pending && pending[0];

    if (!next) {
      await sleep(500);
      continue;
    }

    try {
      console.log("switch to branch:", next.branchUrl ?? "main");

      await activateBranch(repo, { ...args, branchUrl: next.branchUrl });

      console.log("done pull");

      next.buildMetadataOm.handle.change((doc) => {
        doc.refreshState = {
          type: "processing",
          processorHostname: os.hostname(),
          processorHeartbeat: Date.now(),
          buildRuns: null,
        };
      });

      const heartbeatInterval = setInterval(() => {
        next.buildMetadataOm.handle.change((doc) => {
          if (doc.refreshState.type !== "processing") {
            clearInterval(heartbeatInterval);
            return;
          }
          doc.refreshState.processorHeartbeat = Date.now();
        });
      }, 1000);

      await refresh(repo, {
        ...args,
        onProgress: (buildRuns) => {
          next.buildMetadataOm.handle.change((doc) => {
            if (doc.refreshState.type !== "processing") {
              // throw new Error("unexpected state... why are we not processing?");
              console.log(
                "WARNING: unexpected state... why are we not processing?"
              );
              console.log(
                "Here's the current refresh state:",
                doc.refreshState
              );
              return;
            }
            // turn automerge object into POJO before assigning it back to the doc
            doc.refreshState.buildRuns = JSON.parse(JSON.stringify(buildRuns));
          });
        },
      });

      await sleep(500);

      console.log("refresh finished");

      next.buildMetadataOm.handle.change((doc) => {
        doc.refreshState = { type: "idle" };
      });
    } catch (e) {
      console.error("error handling request", e);
      // TODO: better error reporting
      next.buildMetadataOm.handle.change((doc) => {
        doc.refreshState = { type: "idle" };
      });
      await sleep(500);
    }
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
