import { getDoc, waitForLoaded } from "@/doc-reactive";
import { FolderDoc } from "@/packages/folder";
import { DocPath } from "@/packages/folder/datatype";
import { getFolderDocWithChildren } from "@/packages/folder/hooks/useFolderDocWithChildren";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { CommandLineArgs } from ".";
import { FileDoc } from "../../packages/file/src/datatype";
import {
  BuildRun,
  BuildRunWithProgress,
  JacquardBuildMetadata,
} from "../../packages/jacquard/src/datatype";
import {
  getProjectState,
  getStalenessInfo,
} from "../../packages/jacquard/src/getStalenessInfo";
import {
  findWithActiveBranch,
  findWithActiveBranchPromise,
} from "./findWithActiveBranch";
import { run } from "./run";
import { getBuildMetadataDocUrl, waitForSync } from "./util";
import { omit } from "lodash";

export async function refresh(
  repo: Repo,
  {
    dir,
    projectFolderUrl,
    syncServerStorageId,
    patchworkUrl,
    onProgress = () => {},
  }: CommandLineArgs & {
    onProgress?: (buildRuns: BuildRunWithProgress[]) => void;
  }
) {
  if (!projectFolderUrl) {
    console.log("No project folder URL provided.");
    return;
  }

  // get build metadata
  const folderHandle = await findWithActiveBranchPromise<FolderDoc>(
    projectFolderUrl,
    repo
  );

  const folderDoc = await folderHandle.doc();
  if (folderDoc === undefined) {
    console.error(`Could not find doc at ${projectFolderUrl}`);
    process.exit(1);
  }

  const buildMetadataDocUrl = getBuildMetadataDocUrl(folderDoc);
  if (!buildMetadataDocUrl) {
    console.error(`Project has no build metadata`);
    process.exit(1);
  }

  const buildMetadataHandle =
    await findWithActiveBranchPromise<JacquardBuildMetadata>(
      buildMetadataDocUrl,
      repo
    );

  const buildMetadataDoc = await buildMetadataHandle.doc();
  if (!buildMetadataDoc) {
    throw new Error(`Build metadata doc missing: ${buildMetadataDocUrl}`);
  }

  const getCurrentStalenessInfo = async () => {
    const projectState = await waitForLoaded(() => {
      const getDocOnBranchFromUrl = (fileUrl: AutomergeUrl) => {
        const fileHandle = findWithActiveBranch<FileDoc>(fileUrl, repo);
        return getDoc<any>(fileHandle.url, repo);
      };

      const folderDoc = getFolderDocWithChildren(
        projectFolderUrl,
        (docPath: DocPath) =>
          getDocOnBranchFromUrl(docPath[docPath.length - 1].url)
      );

      return getProjectState({
        folderDoc,
        buildRuns: buildMetadataDoc.buildRuns,
        filesReferencedInBuildsOnly: true,
        getDocOnBranchFromUrl,
      });
    });

    return getStalenessInfo(projectState);
  };

  // collect buildRuns that are in progress
  const buildRunsWithProgress: BuildRunWithProgress[] = Object.entries(
    (await getCurrentStalenessInfo()).buildRunStatuses
  ).flatMap(([buildRunId, status]) => {
    if (status.length === 0) {
      return [];
    }

    const buildRun = buildMetadataDoc.buildRuns.find(
      ({ id }) => id === buildRunId
    );
    if (!buildRun) {
      throw new Error(`Build run missing from doc: ${buildRunId}`);
    }

    return [{ ...omit(buildRun, ["timestamp"]), progress: "waiting" }];
  });

  onProgress(buildRunsWithProgress);

  // TODO: report what's gonna run (in unknown order)

  let ranSomethingEver = false;

  while (true) {
    let stalenessInfo = await getCurrentStalenessInfo();

    let ranSomethingThisLoop = false;

    for (const [buildRunId, status] of Object.entries(
      stalenessInfo.buildRunStatuses
    )) {
      if (status.length > 0) {
        // we are stale
        const buildRun = buildMetadataDoc.buildRuns.find(
          ({ id }) => id === buildRunId
        );
        if (!buildRun) {
          throw new Error(`Build run missing from doc: ${buildRunId}`);
        }
        if (
          buildRun.inputs.every(
            (input) => stalenessInfo.docStatuses[input.docUrl].length === 0
          )
        ) {
          const buildRunWithProgress = buildRunsWithProgress.find(
            ({ id }) => id === buildRunId
          );
          if (buildRunWithProgress) {
            buildRunWithProgress.progress = "running";
            onProgress(buildRunsWithProgress);
          }

          // all inputs are up to date, so we can run this build
          console.log(`running build ${buildRunId}: ${buildRun.command}`);
          await run(
            repo,
            {
              dir,
              projectFolderUrl,
              syncServerStorageId,
              patchworkUrl,
              command: buildRun.command,
            },
            false // actually, let's wait now
          );

          if (buildRunWithProgress) {
            buildRunWithProgress.progress = "done";
            onProgress(buildRunsWithProgress);
          }

          ranSomethingThisLoop = true;
          ranSomethingEver = true;
          break;
        }
      }
    }

    console.log("did a loop");

    if (!ranSomethingThisLoop) {
      break;
    }
  }

  if (ranSomethingEver) {
    // TODO: fake handles to wait for
    await waitForSync([], syncServerStorageId);
  }

  // TODO: stretch goals:
  //   "I'm going to run these commands in this order! here's the estimated time"
  //   "go? (y/n)" (unless you -y)
}
