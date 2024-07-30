import { getOm, ifLoaded, useDocReactive, waitForDR } from "@/doc-reactive";
import { useUIStateOm } from "@/explorer/account";
import { selectDocLink } from "@/explorer/hooks/useSelectedDocLink";
import { DocPath } from "@/packages/folder/datatype";
import {
  FolderDocWithMetadata,
  getFolderDocWithChildren,
  useFolderDocWithChildren,
} from "@/packages/folder/hooks/useFolderDocWithChildren";
import { EditorProps } from "@/tools";
import { useBranchScopeAndActiveBranchInfo } from "@/versionControl/hooks";
import { getBranchScopeAndActiveBranchInfo, getOmOnBranchFromPath } from "@/versionControl/signals";
import * as Automerge from "@automerge/automerge";
import { AutomergeUrl, isValidAutomergeUrl } from "@automerge/automerge-repo";
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
import { BuildRefreshButton } from "./BuildRefreshButton";
import { useOm } from "@/om";

export const GraphView = ({
  docUrl,
  docHeads,
  getFakeDocPathForDocUrl,
}: EditorProps<JacquardBuildMetadata, never>) => {
  const repo = useRepo();
  const uiStateOm = useUIStateOm();
  const projectBuildMetadataOm = useOm<JacquardBuildMetadata>(docUrl);
  const projectState = ifLoaded(
    useDocReactive(
      useCallback(() => {
        waitForDR(uiStateOm);
        const latestDocOm = getOm<JacquardBuildMetadata>(docUrl, repo); // ok cuz docUrl is a clone
        const doc = docHeads
          ? Automerge.view(latestDocOm.doc, docHeads)
          : latestDocOm.doc;
        const projectFolderDocPath = getFakeDocPathForDocUrl(
          doc.projectFolderUrl
        );
        const projectFolderOm = getOmOnBranchFromPath(
          projectFolderDocPath,
          uiStateOm,
          repo
        );
        const projectFolderWithMetadata = getFolderDocWithChildren(
          projectFolderOm.url,
          function getDocOnBranchFromPath(docPath: DocPath) {
            return getOmOnBranchFromPath(docPath, uiStateOm, repo).doc;
          }
        );
        return getProjectState({
          folderDoc: projectFolderWithMetadata,
          buildRuns: doc.buildRuns,
          filesReferencedInBuildsOnly: true,
          getDocOnBranchFromUrl(url: AutomergeUrl) {
            const docPath = getFakeDocPathForDocUrl(url);
            return getBranchScopeAndActiveBranchInfo(docPath, uiStateOm, repo)
              .cloneOrMainOm.doc;
          },
        });
      }, [docHeads, docUrl, getFakeDocPathForDocUrl, repo, uiStateOm])
    )
  );

  if (!projectState) {
    return;
  }

  return (
    <div className="p-4 flex flex-col">
      <div className="flex">
        <div className="flex-1" />
        {projectBuildMetadataOm && (
          <BuildRefreshButton
            projectBuildMetadataOm={projectBuildMetadataOm}
            projectState={projectState}
            alignTooltip="end"
          />
        )}
      </div>
      <GraphvizView source={stateGraphSrc(projectState)} />
    </div>
  );
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
