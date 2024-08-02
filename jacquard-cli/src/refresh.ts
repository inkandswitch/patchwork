import { getDoc, waitForLoaded } from "@/doc-reactive";
import { FolderDoc } from "@/packages/folder";
import { DocPath } from "@/packages/folder/datatype";
import { getFolderDocWithChildren } from "@/packages/folder/hooks/useFolderDocWithChildren";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { omit } from "lodash";
import { CommandLineArgs } from ".";
import { FileDoc } from "../../packages/file/src/datatype";
import {
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
import _ from "lodash";

export async function refresh(
  repo: Repo,
  args: CommandLineArgs & {
    onProgress?: (buildRuns: BuildRunWithProgress[]) => void;
  }
) {
  const { projectFolderUrl, syncServerStorageId, onProgress = () => {} } = args;

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

    return [{ ...omit(buildRun, ["timestamp"]), progress: "waiting", log: [] }];
  });

  onProgress(buildRunsWithProgress);

  // TODO: report what's gonna run (in unknown order)

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
          console.log(`running build ${buildRunId}: ${buildRun.spec.command}`);
          // TODO: the _.cloneDeep here is to avoid a "Cannot create a reference
          // to an existing document object" error – is there a more brain-dead
          // way to avoid these?
          await run(repo, _.cloneDeep(buildRun.spec), {
            ...args,
            onLogOutput: (output) => {
              // don't console log in here lol!
              // skip this progress reporting for now - it's causing perf problems
              // because: 1) logs are long strings, 2) we make a new copy of buildRuns inside of onProgress
              // instead of mutating the existing one.
              // if (buildRunWithProgress) {
              //   buildRunWithProgress.log.push(output);
              //   onProgress(buildRunsWithProgress);
              // }
            },
          });

          if (buildRunWithProgress) {
            buildRunWithProgress.progress = "done";
            onProgress(buildRunsWithProgress);
          }

          ranSomethingThisLoop = true;
          break;
        }
      }
    }

    console.log("did a loop");

    if (!ranSomethingThisLoop) {
      break;
    }
  }

  console.log("JAH refresh() done");

  // TODO: stretch goals:
  //   "I'm going to run these commands in this order! here's the estimated time"
  //   "go? (y/n)" (unless you -y)
}
