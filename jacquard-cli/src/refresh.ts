import { asyncComputedPromise, fetchDoc } from "@/async-signals";
import { FolderDoc } from "@/packages/folder";
import { DocPath } from "@/packages/folder/datatype";
import { fetchFolderDocWithChildren } from "@/packages/folder/hooks/useFolderDocWithChildren";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import _, { omit } from "lodash";
import { CommandLineArgs } from ".";
import { FileDoc } from "../../packages/file/src/datatype";
import {
  BuildRunWithProgress,
  JacquardBuildMetadata,
} from "../../packages/jacquard/src/datatype";
import {
  fetchProjectState,
  getStalenessInfo,
} from "../../packages/jacquard/src/getStalenessInfo";
import { run } from "./run";
import {
  fetchOmOnActiveBranch,
  getBuildMetadataDocUrl,
  omOnActiveBranchPromise,
} from "./util";

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
  const folderOm = await omOnActiveBranchPromise<FolderDoc>(
    projectFolderUrl,
    repo
  );

  const buildMetadataDocUrl = getBuildMetadataDocUrl(folderOm.doc);
  if (!buildMetadataDocUrl) {
    console.error(`Project has no build metadata`);
    process.exit(1);
  }

  const buildMetadataOm = await omOnActiveBranchPromise<JacquardBuildMetadata>(
    buildMetadataDocUrl,
    repo
  );

  const getCurrentStalenessInfo = async () => {
    const projectState = await asyncComputedPromise(() => {
      const fetchDocOnBranchFromUrl = (fileUrl: AutomergeUrl) =>
        fetchOmOnActiveBranch<FileDoc>(fileUrl, repo).doc;

      const folderDoc = fetchFolderDocWithChildren(
        projectFolderUrl,
        (docPath: DocPath) =>
          fetchDocOnBranchFromUrl(docPath[docPath.length - 1].url)
      );

      return fetchProjectState({
        folderDoc,
        buildRuns: buildMetadataOm.doc.buildRuns,
        filesReferencedInBuildsOnly: true,
        fetchDocOnBranchFromUrl,
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

    const buildRun = buildMetadataOm.doc.buildRuns.find(
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
        const buildRun = buildMetadataOm.doc.buildRuns.find(
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
