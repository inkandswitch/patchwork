import { ifLoaded, incorporateDocReactiveState, parallelMap, useDocReactive } from "@/doc-reactive";
import { UIStateDoc, useUIStateHandleDocReactive } from "@/explorer/account";
import { selectDocLink } from "@/explorer/hooks/useSelectedDocLink";
import { DocPath } from "@/packages/folder/datatype";
import {
  FolderDocWithMetadata,
  useFolderDocWithChildren,
} from "@/packages/folder/hooks/useFolderDocWithChildren";
import { EditorProps } from "@/tools";
import { objectEntries } from "@/utils";
import { useBranchScopeAndActiveBranchInfo } from "@/versionControl/hooks";
import { branchScopeAndActiveBranchInfo } from "@/versionControl/signals";
import * as Automerge from "@automerge/automerge";
import { AutomergeUrl, DocHandle, isValidAutomergeUrl, Repo } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { instance } from "@viz-js/viz";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDoc } from "../../../file/src/datatype";
import { BuildRun, JacquardBuildMetadata } from "../datatype";
import {
  getProjectState,
  getReferenceFromDocUrl,
  getStalenessInfo,
  headsMatch,
  ProjectState,
  reasonToString,
} from "../getStalenessInfo";

export const GraphView = ({
  docUrl,
  docHeads,
  getFakeDocPathForDocUrl,
}: EditorProps<JacquardBuildMetadata, never>) => {
  const [latestDoc] = useDocument<JacquardBuildMetadata>(docUrl); // ok cuz docUrl is a clone

  const doc = useMemo(
    () =>
      docHeads && latestDoc ? Automerge.view(latestDoc, docHeads) : latestDoc,
    [latestDoc, docHeads]
  );

  const folderProjectDocPath = doc && getFakeDocPathForDocUrl(doc.projectFolderUrl);
  const branchScopeAndActiveBranchInfo = ifLoaded(useBranchScopeAndActiveBranchInfo(folderProjectDocPath));
  const projectFolderOm = branchScopeAndActiveBranchInfo?.cloneOrMainOm;

  const projectFolder = useFolderDocWithChildren(projectFolderOm?.url);

  // const [projectFolderDoc] = useDocument<FolderDoc>(doc?.projectFolderUrl);

  const projectState = useProjectState({
    folderDoc: projectFolder,
    buildRuns: doc?.buildRuns ?? [],
    filesReferencedInBuildsOnly: true,
    getFakeDocPathForDocUrl,
  });

  console.log("projectState", projectState);

  if (!projectState) {
    return;
  }

  return (
    <div className="p-4">
      <GraphvizView source={stateGraphSrc(projectState)} />
    </div>
  );
};

const useProjectState = ({
  folderDoc,
  buildRuns,
  filesReferencedInBuildsOnly,
  getFakeDocPathForDocUrl,
}: {
  folderDoc: FolderDocWithMetadata | undefined;
  buildRuns: BuildRun[];
  filesReferencedInBuildsOnly?: boolean;
  getFakeDocPathForDocUrl: (docUrl: AutomergeUrl) => DocPath;
}): ProjectState | undefined => {
  const repo = useRepo();
  const uiStateHandle = useUIStateHandleDocReactive();
  return ifLoaded(useDocReactive(useCallback(() => {
    if (!folderDoc) { return; }
    incorporateDocReactiveState(uiStateHandle);
    return getProjectState({
      repo,
      uiStateHandle: uiStateHandle,
      folderDoc,
      buildRuns,
      filesReferencedInBuildsOnly,
      getFakeDocPathForDocUrl,
    });
  }, [buildRuns, filesReferencedInBuildsOnly, folderDoc, getFakeDocPathForDocUrl, repo, uiStateHandle])));
};

const GraphvizView = ({ source }: { source: string }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
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
        const svg = viz.renderSVGElement(source);
        container.appendChild(svg);

        // Add click event listeners to all nodes
        svg.querySelectorAll(".node").forEach((node) => {
          const titleElement = node.querySelector("title");
          const nodeIdFromTitle = titleElement
            ? titleElement.textContent
            : undefined;

          const possibleAutomergeUrl = nodeIdFromTitle
            ?.slice(1)
            .replaceAll("_", ":");

          if (!isValidAutomergeUrl(possibleAutomergeUrl)) {
            return;
          }

          (node as SVGElement).style.cursor = "pointer";

          node.addEventListener("click", (e) => {
            const docUrl = possibleAutomergeUrl as AutomergeUrl;
            selectDocLink({
              url: docUrl,
              name: "fake",
              type: "file", // TODO: figure out what to do when we have non file-type docs
            });
          });
        });
      }
    });
  }, [container, source]);

  return <div ref={setContainer}></div>;
};

function stateGraphSrc(state: ProjectState) {
  const stalenessInfo = getStalenessInfo(state);

  const lines = [];
  for (let reference of state.references) {
    const status = stalenessInfo.docStatuses[reference.docUrl];
    lines.push(`${gvId(reference.docUrl)} [
      shape=plain
      label="${reference.path}"
      fontsize=10
      fontname="sans-serif"
      tooltip="${status.map(reasonToString).join("; ")}"
      ${status.length > 0 ? 'style=filled fillcolor="#fdba74"' : ""}
    ];`);
  }
  for (let buildRun of state.buildRuns) {
    const status = stalenessInfo.buildRunStatuses[buildRun.id];
    lines.push(`${gvId(buildRun.id)} [
      shape=plain
      label="${buildRun.command}"
      fontname="sans-serif"
      fontsize=10
      tooltip="${status.map(reasonToString).join("; ")}"
      ${status.length > 0 ? 'style=filled fillcolor="#fdba74"' : ""}
    ];`);
    for (let input of buildRun.inputs) {
      const inputReferenceInState = getReferenceFromDocUrl(state, input.docUrl);
      const outOfDate = !headsMatch(inputReferenceInState.heads, input.heads);
      lines.push(`${gvId(input.docUrl)} -> ${gvId(buildRun.id)} [
        color=${outOfDate ? '"#fdba74"' : '"#AAAAAA"'}
        style=${outOfDate ? '"dashed"' : '"solid"'}
      ];`);
    }
    for (let output of buildRun.outputs) {
      lines.push(`${gvId(buildRun.id)} -> ${gvId(output.docUrl)} [
        color="#A9A9A9"
      ];`);
    }
  }

  const source = `digraph {
    graph [pad="0.2"];
    rankdir="LR";
    ${lines.join("\n")}
  }`;

  return source;
}

function gvId(str: string) {
  // add a _ prefix because ids can't start with a number
  return `_${str
    .replaceAll("-", "_")
    .replaceAll(".", "_")
    .replaceAll(":", "_")}`;
}
