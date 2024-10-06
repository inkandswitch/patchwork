import { asyncComputedPromise, fetchDoc } from "@/async-signals";
import { FolderDoc } from "@/packages/folder";
import { DocPath } from "@/packages/folder/datatype";
import { fetchFolderDocWithMetadata } from "@/packages/folder/hooks/fetchFolderDocWithMetadata";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import _, { omit } from "lodash";
import { CommandLineArgs } from ".";
import { FileDoc } from "../../packages/file/src/datatype";
import {
  BuildRunRefreshState,
  JacquardBuildMetadata,
} from "../../packages/jacquard/src/datatype";
import {
  fetchProjectState,
  getStalenessInfo,
} from "../../packages/jacquard/src/getStalenessInfo";
import { run } from "./run";
import {
  fetchOmOnCLIActiveBranch,
  getBuildMetadataDocUrl,
  omOnCLIActiveBranchPromise,
} from "./util";

export async function refresh(
  repo: Repo,
  args: CommandLineArgs & {
    onProgress?: (buildRunRefreshStates: BuildRunRefreshState[]) => void;
  }
) {
  const { projectFolderUrl, syncServerStorageId, onProgress = () => {} } = args;

  if (!projectFolderUrl) {
    console.log("No project folder URL provided.");
    return;
  }

  // get build metadata
  const folderOm = await omOnCLIActiveBranchPromise<FolderDoc>(
    projectFolderUrl,
    repo
  );

  const buildMetadataDocUrl = getBuildMetadataDocUrl(folderOm.doc);
  if (!buildMetadataDocUrl) {
    console.error(`Project has no build metadata`);
    process.exit(1);
  }

  const buildMetadataOm =
    await omOnCLIActiveBranchPromise<JacquardBuildMetadata>(
      buildMetadataDocUrl,
      repo
    );

  const getCurrentStalenessInfo = async () => {
    const projectState = await asyncComputedPromise(() => {
      const fetchDocOnBranchFromUrl = (fileUrl: AutomergeUrl) =>
        fetchOmOnCLIActiveBranch<FileDoc>(fileUrl, repo).doc;

      const folderDoc = fetchFolderDocWithMetadata(
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
  const buildRunRefreshStates: BuildRunRefreshState[] = Object.entries(
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

    return [
      { id: buildRun.id, spec: buildRun.spec, progress: "waiting", log: [] },
    ];
  });

  onProgress(buildRunRefreshStates);

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
          const buildRunRefreshState = buildRunRefreshStates.find(
            ({ id }) => id === buildRunId
          );
          if (buildRunRefreshState) {
            buildRunRefreshState.progress = "running";
            onProgress(buildRunRefreshStates);
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
              // if (buildRunRefreshState) {
              //   buildRunRefreshState) {.log.push(output);
              //   onProgress(buildRunRefreshStates);
              // }
            },
          });

          if (buildRunRefreshState) {
            buildRunRefreshState.progress = "done";
            onProgress(buildRunRefreshStates);
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
