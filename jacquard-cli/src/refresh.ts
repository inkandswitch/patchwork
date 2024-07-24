import { FolderDoc } from "@/packages/folder";
import { objectFromEntries } from "@/utils";
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
import { findWithActiveBranch } from "./findWithActiveBranch";

// TODO: jacquard watch

export async function refresh(
  repo: Repo,
  { dir, projectFolderUrl, syncServerStorageId, patchworkUrl }: CommandLineArgs
) {
  if (!projectFolderUrl) {
    console.log("No project folder URL provided.");
    return;
  }

  // get build metadata
  const folderHandle = await findWithActiveBranch<FolderDoc>(
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

  const buildMetadataHandle = await findWithActiveBranch<JacquardBuildMetadata>(
    buildMetadataDocUrl,
    repo
  );

  // TODO: report what's gonna run (in unknown order)

  let ranSomethingEver = false;

  while (true) {
    const buildMetadataDoc = await buildMetadataHandle.doc();
    if (!buildMetadataDoc) {
      throw new Error(`Build metadata doc missing: ${buildMetadataDocUrl}`);
    }

    const projectState = await getProjectState(
      repo,
      folderDoc,
      buildMetadataDoc.buildRuns
    );
    const stalenessInfo = getStalenessInfo(projectState);

    console.log(stalenessInfo);

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
            false,  // actually, let's wait now
          );
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

// TODO: copied out of GraphView
function headsMatch(heads1: Automerge.Heads, heads2: Automerge.Heads) {
  // TODO: we should be able to use equality to check if heads match, but
  // there's a bug where cloning a doc adds an extra head to it; pvh promises
  // this will get fixed soon. for now we will check if one set of heads is the
  // subset of another – this is generally atypical cuz we don't do much
  // concurrent stuff.
  return heads1.every((head) => heads2.includes(head)) || heads2.every((head) => heads1.includes(head));
}


// TODO: adapted from GraphView hook; signals would unify them
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

  const files = objectFromEntries(
    await Promise.all(
      fileUrls.map(async (fileUrl) => {
        const fileHandle = await findWithActiveBranch<FileDoc>(fileUrl, repo);
        const doc = await fileHandle.doc();
        if (!doc) {
          throw new Error(`File doc missing: ${fileHandle.url} (main: ${fileUrl})`);
        }
        return [fileUrl, doc];
      })
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

      return doc && headsMatch(Automerge.getHeads(doc), heads);
    })
  );

  return {
    references,
    buildRuns: filteredBuildRuns,
  };
}
