import { BuildRun, Reference } from "./datatype";
import * as Automerge from "@automerge/automerge";


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

export function reasonToString(reason) {
  const affectStr =
    reason.intermediateChain.length > 0
      ? `through ${reason.intermediateChain.join(" → ")}`
      : "directly";
  return `${reason.originalChangeOld.docUrl} changed from ${reason.originalChangeOld.heads} to ${reason.originalChangeNew.heads}, affecting us ${affectStr}`;
}

export function getStalenessInfo(state: ProjectState): StalenessInfo {
  let docStatuses = {};
  let buildRunStatuses = {};

  function getReferenceStatus(reference) {
    if (docStatuses[reference.docUrl]) {
      return docStatuses[reference.docUrl];
    }

    let status = [];
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

  function getBuildRunStatus(buildRun: BuildRun) {
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

export function getBuildRunOutputtingDocUrl(state, docUrl) {
  return state.buildRuns.find((buildRun) =>
    buildRun.outputs.some((output) => output.docUrl === docUrl)
  );
}

export function getReferenceFromDocUrl(state, docUrl) {
  return state.references.find((reference) => reference.docUrl === docUrl);
}

export function addToReasonChain(reason, link) {
  return {
    ...reason,
    intermediateChain: [...reason.intermediateChain, link],
  };
}
