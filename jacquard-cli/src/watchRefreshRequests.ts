import { asyncComputed, fetchDoc, fetchMap, fetchOm } from "@patchwork/sdk/async-signals";
import { Om } from "@patchwork/sdk/om";
import { FolderDoc } from "@/packages/folder";
import {
  fetchResolveUrlOnFixedBranch,
  fetchVersionControlMetadataOm,
} from "@patchwork/sdk/versionControl";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import debugFactory from "debug";
import os from "node:os";
import { CommandLineArgs } from ".";
import { JacquardBuildMetadata } from "../../packages/jacquard/src/datatype";
import { activateBranch } from "./activate";
import { refresh } from "./refresh";
import { sleep } from "./util";

const debug = debugFactory("jacquard-cli:run");

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

  const buildMetadataDocsWithRefreshRequest = asyncComputed<
    BuildMetadataDocWithBranchUrl[]
  >(() => {
    const projectFolder = fetchDoc<FolderDoc>(projectFolderHandle.url, repo);

    const versionControlMetadataOm = fetchVersionControlMetadataOm(
      projectFolder,
      repo
    );

    if (!versionControlMetadataOm?.doc.isBranchScope) {
      debug("skip check branches");
      return [];
    }

    // check build metadata on main
    const mainBuildMetadataOm = fetchBuildMetadataOmOfFolder(
      projectFolder,
      repo
    );

    if (!mainBuildMetadataOm) {
      debug("skip has no build metadata");
      return [];
    }

    const allBuildMetadataDocs: BuildMetadataDocWithBranchUrl[] = [
      { buildMetadataOm: mainBuildMetadataOm },
      ...fetchMap(versionControlMetadataOm.doc.branches, (branchUrl) => {
        const branchBuildMetadataDocUrl = fetchResolveUrlOnFixedBranch(
          mainBuildMetadataOm.url,
          branchUrl,
          repo
        ).url;

        const branchBuildMetadataOm = fetchOm<JacquardBuildMetadata>(
          branchBuildMetadataDocUrl,
          repo
        );

        return { buildMetadataOm: branchBuildMetadataOm, branchUrl };
      }),
    ];

    return allBuildMetadataDocs.filter(
      ({ buildMetadataOm }) =>
        buildMetadataOm.doc.refreshState?.type === "requesting"
    );
  });

  console.log("waiting for requests ...");

  while (true) {
    const pending =
      buildMetadataDocsWithRefreshRequest.value.ifPending(undefined).value;
    const next = pending && pending[0];

    if (!next) {
      await sleep(500);
      continue;
    }

    try {
      debug("switch to branch:", next.branchUrl ?? "main");

      await activateBranch(repo, { ...args, branchUrl: next.branchUrl });

      debug("done pull");

      next.buildMetadataOm.handle.change((doc) => {
        doc.refreshState = {
          type: "processing",
          processorHostname: os.hostname(),
          processorHeartbeat: Date.now(),
          buildRunRefreshStates: null,
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
        onProgress: (buildRunRefreshStates) => {
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
            doc.refreshState.buildRunRefreshStates = JSON.parse(
              JSON.stringify(buildRunRefreshStates)
            );
          });
        },
      });

      await sleep(500);

      debug("refresh finished");

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

const fetchBuildMetadataOmOfFolder = (projectFolder: FolderDoc, repo: Repo) => {
  const buildMetadataDocLink = projectFolder.docs.find(
    (docLink) => docLink.type === "jacquard-build-metadata"
  );

  if (!buildMetadataDocLink) {
    return;
  }

  return fetchOm<JacquardBuildMetadata>(buildMetadataDocLink.url, repo);
};
