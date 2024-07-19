import { FolderDoc } from "@/packages/folder";
import * as Automerge from "@automerge/automerge";
import { AutomergeUrl, Doc, Repo } from "@automerge/automerge-repo";
import { CommandLineArgs } from ".";
import { FileDoc } from "../../packages/file/src/datatype";
import {
  BuildRun,
  JacquardBuildMetadata,
} from "../../packages/jacquard/src/datatype";
import {
  getStalenessInfo,
  ProjectState,
} from "../../packages/jacquard/src/getStalenessInfo";
import { run } from "./run";
import { getBuildMetadataDocUrl, waitForSync } from "./util";

// TODO: jacquard watch

export async function refresh(
  repo: Repo,
  { dir, projectFolderUrl, syncServerStorageId, patchworkUrl }: CommandLineArgs
) {
  // get build metadata
  const folderHandle = repo.find<FolderDoc>(projectFolderUrl);

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
    repo.find<JacquardBuildMetadata>(buildMetadataDocUrl);

  // TODO: report what's gonna run (in unknown order)

  while (true) {
    const buildMetadataDoc = await buildMetadataHandle.doc();

    const projectState = await getProjectState(
      repo,
      folderDoc,
      buildMetadataDoc.buildRuns
    );
    const stalenessGraph = getStalenessInfo(projectState);

    console.log(stalenessGraph);

    let ranSomething = false;

    for (const [buildRunId, status] of Object.entries(
      stalenessGraph.buildRunStatuses
    )) {
      if (status.length > 0) {
        // we are stale
        const buildRun = buildMetadataDoc.buildRuns.find(
          ({ id }) => id === buildRunId
        );
        if (
          buildRun.inputs.every(
            (input) => stalenessGraph.docStatuses[input.docUrl].length === 0
          )
        ) {
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
            true,  // actually, let's wait now
          );
          ranSomething = true;
          break;
        }
      }
    }

    console.log("did a loop");

    if (!ranSomething) {
      break;
    }
  }
  // TODO: stretch goals:
  //   "I'm going to run these commands in this order! here's the estimated time"
  //   "go? (y/n)" (unless you -y)
}

async function getProjectState(
  repo: Repo,
  folderDoc: Doc<FolderDoc>,
  buildRuns: BuildRun[]
): Promise<ProjectState> {
  const filesReferencedInBuildsOnly = true;

  const fileUrls = folderDoc.docs.flatMap(({ url }) =>
    !filesReferencedInBuildsOnly ||
    // filter out files that are not referenced by any build run
    buildRuns.some(
      ({ inputs, outputs }) =>
        inputs.some((input) => input.docUrl === url) ||
        outputs.some((output) => output.docUrl === url)
    )
      ? [url]
      : []
  );

  const files = Object.fromEntries(
    await Promise.all(
      fileUrls.map((fileUrl) =>
        repo
          .find(fileUrl)
          .doc()
          .then((doc) => [fileUrl, doc])
      )
    )
  );

  const references = Object.entries(files).map(([docUrl, doc]) => ({
    docUrl: docUrl as AutomergeUrl,
    heads: Automerge.getHeads(doc),
    path: (doc as FileDoc).name, // todo: handle this generically, we just assume here that this is a file doc
  }));

  // filter out build runs that are no longer relevant
  // a build run is relevant as long as at least one of it's output still exists in the current project
  const filteredBuildRuns = buildRuns.filter(({ outputs }, index) =>
    outputs.some(({ docUrl, heads }) => {
      const doc = files[docUrl];

      return doc && Automerge.equals(Automerge.getHeads(doc), heads);
    })
  );

  return {
    references,
    buildRuns: filteredBuildRuns,
  };
}
