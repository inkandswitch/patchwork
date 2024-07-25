import { parallelMap } from "@/doc-reactive";
import { UIStateDoc } from "@/explorer/account";
import { DocPath } from "@/packages/folder/datatype";
import {
  FolderDocWithMetadata
} from "@/packages/folder/hooks/useFolderDocWithChildren";
import { objectEntries } from "@/utils";
import { branchScopeAndActiveBranchInfo } from "@/versionControl/signals";
import * as Automerge from "@automerge/automerge";
import { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import { FileDoc } from "../../file/src/datatype";
import { BuildRun, Reference } from "./datatype";

export function headsMatch(heads1: Automerge.Heads, heads2: Automerge.Heads) {
  // TODO: we should be able to use equality to check if heads match, but
  // there's a bug where cloning a doc adds an extra head to it; pvh promises
  // this will get fixed soon. for now we will check if one set of heads is the
  // subset of another – this is generally atypical cuz we don't do much
  // concurrent stuff.
  return (
    heads1.every((head) => heads2.includes(head)) ||
    heads2.every((head) => heads1.includes(head))
  );
}

export type ProjectState = {
  references: Reference[];
  buildRuns: BuildRun[];
};

export const getProjectState = ({
  folderDoc,
  buildRuns,
  filesReferencedInBuildsOnly,
  getDocOnBranch,
}: {
  folderDoc: FolderDocWithMetadata;
  buildRuns: BuildRun[];
  filesReferencedInBuildsOnly?: boolean;
  getDocOnBranch: (url: AutomergeUrl) => Automerge.Doc<FileDoc>;
}): ProjectState => {
  const fileUrls = folderDoc.flatDocLinks.flatMap(({ url }) =>
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

  let files: Record<AutomergeUrl, Automerge.Doc<FileDoc>> = {};
  parallelMap(fileUrls, (url) => {
    files[url] = getDocOnBranch(url);
  });

  const references = objectEntries(files).map(([docUrl, doc]) => ({
    docUrl: docUrl as AutomergeUrl,
    heads: Automerge.getHeads(doc),
    path: (doc as FileDoc).name, // todo: handle this generically, we just assume here that this is a file doc
  }));

  // filter out build runs that are no longer relevant
  // a build run is relevant as long as ALL of its output still exists in the current project
  // TODO: this used to be "at least one", but we're gonna lazily try this
  const filteredBuildRuns = buildRuns.filter(({ outputs }) =>
    outputs.every(({ docUrl, heads }) => {
      const doc = files[docUrl];
      return doc && headsMatch(Automerge.getHeads(doc), heads);
    })
  );

  return {
    references,
    buildRuns: filteredBuildRuns,
  };
};

export type StalenessInfo = {
  docStatuses: Record<string, StaleStatus>; // keyed by docUrl
  buildRunStatuses: Record<string, StaleStatus>; // keyed by BuildRun id
};

export type StaleStatus = StaleReason[];

export type StaleReason = {
  originalChangeOld: Reference;
  originalChangeNew: Reference;
  intermediateChain: string[];
};

export function reasonToString(reason: StaleReason) {
  const affectStr =
    reason.intermediateChain.length > 0
      ? `through ${reason.intermediateChain.join(" → ")}`
      : "directly";
  return `${reason.originalChangeOld.docUrl} changed from ${reason.originalChangeOld.heads} to ${reason.originalChangeNew.heads}, affecting us ${affectStr}`;
}

export function getStalenessInfo(state: ProjectState): StalenessInfo {
  let docStatuses: Record<string, StaleStatus> = {};
  let buildRunStatuses: Record<string, StaleStatus> = {};

  function getReferenceStatus(reference: Reference): StaleStatus {
    if (docStatuses[reference.docUrl]) {
      return docStatuses[reference.docUrl];
    }

    let status: StaleStatus = [];
    const buildRun = getBuildRunOutputtingDocUrl(state, reference.docUrl);
    if (buildRun) {
      // is the build run producing this doc out of date? if so, copy those reasons, adding the build run to the chain
      status = getBuildRunStatus(buildRun).map((reason) =>
        addToReasonChain(reason, buildRun.id)
      );
    }
    docStatuses[reference.docUrl] = status;
    return status;
  }

  function getBuildRunStatus(buildRun: BuildRun): StaleStatus {
    if (buildRunStatuses[buildRun.id]) {
      return buildRunStatuses[buildRun.id];
    }

    let status = [];
    for (let input of buildRun.inputs) {
      const inputReferenceInState = getReferenceFromDocUrl(state, input.docUrl);
      if (!Automerge.equals(inputReferenceInState.heads, input.heads)) {
        // orange arrow
        status.push({
          originalChangeOld: input,
          originalChangeNew: inputReferenceInState,
          intermediateChain: [],
        });
      } else {
        // might inherit staleness from upstream
        status.push(
          ...getReferenceStatus(input).map((reason) =>
            addToReasonChain(reason, input.docUrl)
          )
        );
      }
    }
    buildRunStatuses[buildRun.id] = status;
    return status;
  }

  for (let reference of state.references) {
    getReferenceStatus(reference);
  }

  for (let buildRun of state.buildRuns) {
    getBuildRunStatus(buildRun);
  }

  return { docStatuses, buildRunStatuses };
}

export function getBuildRunOutputtingDocUrl(state: ProjectState, docUrl: AutomergeUrl): BuildRun | undefined {
  const found = state.buildRuns.find((buildRun) =>
    buildRun.outputs.some((output) => output.docUrl === docUrl)
  );
  return found;
}

export function getReferenceFromDocUrl(state: ProjectState, docUrl: AutomergeUrl): Reference {
  const found = state.references.find((reference) => reference.docUrl === docUrl);
  if (!found) {
    throw new Error(`Could not find reference for ${docUrl}`);
  }
  return found;
}

export function addToReasonChain(reason: StaleReason, link: string) {
  return {
    ...reason,
    intermediateChain: [...reason.intermediateChain, link],
  };
}
