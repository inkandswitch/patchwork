import { FolderDoc } from "@/packages/folder";
import * as Automerge from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocuments } from "@automerge/automerge-repo-react-hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { instance } from "@viz-js/viz";
import { BuildRun, Reference } from "../datatype";
import LoadingSpinnerOfShame from "./LoadingSpinnerOfShame";
import { FileDoc } from "../../../file/src/datatype";

type GraphViewProps = {
  buildRuns: BuildRun[];
  projectFolderDoc: FolderDoc;
};

export const GraphView = ({ projectFolderDoc, buildRuns }: GraphViewProps) => {
  const projectState = useProjectState({
    folderDoc: projectFolderDoc,
    buildRuns,
    filesReferencedInBuildsOnly: true,
  });

  if (!projectState) {
    return <LoadingSpinnerOfShame />;
  }

  return <GraphvizView source={stateGraphSrc(projectState)} />;
};

type ProjectState = {
  references: Reference[];
  buildRuns: BuildRun[];
};

const useProjectState = ({
  folderDoc,
  buildRuns,
  filesReferencedInBuildsOnly,
}: {
  folderDoc: FolderDoc;
  buildRuns: BuildRun[];
  filesReferencedInBuildsOnly?: boolean;
}): ProjectState => {
  const fileUrls = useMemo(
    () =>
      !folderDoc
        ? []
        : folderDoc.docs.flatMap(({ url }) =>
            !filesReferencedInBuildsOnly ||
            buildRuns.some(
              ({ inputs, outputs }) =>
                inputs.some((input) => input.docUrl === url) ||
                outputs.some((output) => output.docUrl === url)
            )
              ? [url]
              : []
          ),
    [folderDoc?.docs]
  );
  const files = useDocuments(fileUrls);

  const references = useMemo<Reference[]>(
    () =>
      Object.entries(files).map(([id, doc]) => ({
        docUrl: `automerge:${id}` as AutomergeUrl,
        heads: Automerge.getHeads(doc),
        path: (doc as FileDoc).name, // todo: handle this generically, we just assume here that this is a file doc
      })),
    [files]
  );

  return useMemo<ProjectState>(
    () =>
      !folderDoc || fileUrls.length !== references.length
        ? null
        : {
            references,
            buildRuns,
          },
    [folderDoc, buildRuns, references]
  );
};

const GraphvizView = ({ source }: { source: string }) => {
  const [container, setContainer] = useState<HTMLElement>();
  const sourceRef = useRef<string>();
  sourceRef.current = source;

  useEffect(() => {
    if (!container) {
      return;
    }

    instance().then((viz) => {
      // make sure that the source hasn't changed while waiting for the render to finish
      if (sourceRef.current === source) {
        container.innerText = "";
        container.appendChild(viz.renderSVGElement(source));
      }
    });
  }, [container, source]);

  return <div ref={setContainer}></div>;
};

type BuildGraph = {
  docStatuses: Record<string, StaleStatus>; // keyed by docUrl
  buildRunStatuses: Record<string, StaleStatus>; // keyed by BuildRun id
};

type StaleStatus = StaleReason[];

type StaleReason = {
  originalChangeOld: Reference;
  originalChangeNew: Reference;
  intermediateChain: string[];
};

function stateGraphSrc(state: ProjectState) {
  const buildGraph = makeBuildGraph(state);

  const lines = [];
  for (let reference of state.references) {
    const status = buildGraph.docStatuses[reference.docUrl];
    lines.push(`${gvId(reference.docUrl)} [
      shape=plain
      label="${reference.path}"
      tooltip="${status.map(reasonToString).join("; ")}"
      ${status.length > 0 ? "style=filled fillcolor=orange" : ""}
    ];`);
  }
  for (let buildRun of state.buildRuns) {
    const status = buildGraph.buildRunStatuses[buildRun.id];
    lines.push(`${gvId(buildRun.id)} [
      shape=plain 
      label="${buildRun.command}"
      fontcolor=blue
      tooltip="${status.map(reasonToString).join("; ")}"
      ${status.length > 0 ? "style=filled fillcolor=orange" : ""}
    ];`);
    for (let input of buildRun.inputs) {
      const inputReferenceInState = getReferenceFromDocUrl(state, input.docUrl);
      const outOfDate = !Automerge.equals(
        inputReferenceInState.heads,
        input.heads
      );
      lines.push(`${gvId(input.docUrl)} -> ${gvId(buildRun.id)} [
        color=${outOfDate ? '"orange"' : '"black"'}
        style=${outOfDate ? '"dashed"' : '"solid"'}
      ];`);
    }
    for (let output of buildRun.outputs) {
      lines.push(`${gvId(buildRun.id)} -> ${gvId(output.docUrl)};`);
    }
  }

  const source = `digraph {
    rankdir="LR";
    ${lines.join("\n")}
  }`;

  return source;
}

function reasonToString(reason) {
  const affectStr =
    reason.intermediateChain.length > 0
      ? `through ${reason.intermediateChain.join(" → ")}`
      : "directly";
  return `${reason.originalChangeOld.docUrl} changed from ${reason.originalChangeOld.heads} to ${reason.originalChangeNew.heads}, affecting us ${affectStr}`;
}

function gvId(str: string) {
  // add a _ prefix because ids can't start with a number
  return `_${str
    .replaceAll("-", "_")
    .replaceAll(".", "_")
    .replaceAll(":", "_")}`;
}

function makeBuildGraph(state: ProjectState): BuildGraph {
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

function getBuildRunOutputtingDocUrl(state, docUrl) {
  return state.buildRuns.find((buildRun) =>
    buildRun.outputs.some((output) => output.docUrl === docUrl)
  );
}

function getReferenceFromDocUrl(state, docUrl) {
  return state.references.find((reference) => reference.docUrl === docUrl);
}

function addToReasonChain(reason, link) {
  return {
    ...reason,
    intermediateChain: [...reason.intermediateChain, link],
  };
}
