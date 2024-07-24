import { BuildRun, Reference } from "./datatype";
import * as Automerge from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";


export type ProjectState = {
  references: Reference[];
  buildRuns: BuildRun[];
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
