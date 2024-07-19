import { useUIStateHandle } from "@/explorer/account";
import { selectDocLink } from "@/explorer/hooks/useSelectedDocLink";
import { FolderDoc } from "@/packages/folder";
import { DocPath } from "@/packages/folder/datatype";
import { EditorProps } from "@/tools";
import { objectEntries } from "@/utils";
import { useBranchScopeAndActiveBranchInfo } from "@/versionControl/hooks";
import { branchScopeAndActiveBranchInfoSig } from "@/versionControl/signals";
import * as Automerge from "@automerge/automerge";
import {
  AutomergeUrl,
  isValidAutomergeUrl
} from "@automerge/automerge-repo";
import {
  useDocument,
  useRepo
} from "@automerge/automerge-repo-react-hooks";
import { instance } from "@viz-js/viz";
import { useEffect, useMemo, useRef, useState } from "react";
import { computed } from "signia";
import { useValue } from "signia-react";
import { FileDoc } from "../../../file/src/datatype";
import { BuildRun, JacquardBuildMetadata, Reference } from "../datatype";
import { getReferenceFromDocUrl, getStalenessInfo, ProjectState, reasonToString } from "../getStalenessInfo";

export const GraphView = ({
  docUrl,
  docHeads,
  getFakeDocPathForDocUrl,
}: EditorProps<JacquardBuildMetadata, never>) => {
  const [latestDoc] = useDocument<JacquardBuildMetadata>(docUrl);  // ok cuz docUrl is a clone

  const doc = useMemo(
    () => (docHeads ? Automerge.view(latestDoc, docHeads) : latestDoc),
    [latestDoc, docHeads]
  );

  const folderProjectDocPath = getFakeDocPathForDocUrl(doc?.projectFolderUrl);
  const { cloneOrMainOm: projectFolderOm } = useBranchScopeAndActiveBranchInfo(folderProjectDocPath);


  // const [projectFolderDoc] = useDocument<FolderDoc>(doc?.projectFolderUrl);

  const projectState = useProjectState({
    folderDoc: projectFolderOm.doc as FolderDoc,
    buildRuns: doc?.buildRuns ?? [],
    filesReferencedInBuildsOnly: true,
    getFakeDocPathForDocUrl
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

export function headsMatch(heads1: Automerge.Heads, heads2: Automerge.Heads) {
  // TODO: we should be able to use equality to check if heads match, but
  // there's a bug where cloning a doc adds an extra head to it; pvh promises
  // this will get fixed soon. for now we will check if one set of heads is the
  // subset of another – this is generally atypical cuz we don't do much
  // concurrent stuff.
  return heads1.every((head) => heads2.includes(head)) || heads2.every((head) => heads1.includes(head));
}

const useProjectState = ({
  folderDoc,
  buildRuns,
  filesReferencedInBuildsOnly,
  getFakeDocPathForDocUrl,
}: {
  folderDoc: FolderDoc;
  buildRuns: BuildRun[];
  filesReferencedInBuildsOnly?: boolean;
  getFakeDocPathForDocUrl: (docUrl: AutomergeUrl) => DocPath;
}): ProjectState => {
  const fileUrls = useMemo(
    () =>
      !folderDoc
        ? []
        : folderDoc.docs.flatMap(({ url }) =>
            !filesReferencedInBuildsOnly ||
            // filter out files that are not referenced by any build run
            buildRuns.some(
              ({ inputs, outputs }) =>
                inputs.some((input) => input.docUrl === url) ||
                outputs.some((output) => output.docUrl === url)
            )
              ? [url]
              : []
          ),
    [buildRuns, filesReferencedInBuildsOnly, folderDoc]
  );
  const repo = useRepo();
  const uiStateHandle = useUIStateHandle();
  const files = useValue(useMemo(() => computed('', () => {
    let result: Record<AutomergeUrl, Automerge.Doc<unknown>> = {};
    for (let url of fileUrls) {
      const docPath = getFakeDocPathForDocUrl(url);
      const maybeDoc = branchScopeAndActiveBranchInfoSig(docPath, uiStateHandle, repo).value?.cloneOrMainOm?.doc;
      if (maybeDoc) {
        result[url] = maybeDoc;
      }
    };
    return result;
  }), [fileUrls, getFakeDocPathForDocUrl, repo, uiStateHandle]));

  const references = useMemo<Reference[]>(
    () =>
      objectEntries(files).map(([docUrl, doc]) => ({
        docUrl: docUrl as AutomergeUrl,
        heads: Automerge.getHeads(doc),
        path: (doc as FileDoc).name, // todo: handle this generically, we just assume here that this is a file doc
      })),
    [files]
  );

  const filteredBuildRuns = useMemo(
    () =>
      // filter out build runs that are no longer relevant
      // a build run is relevant as long as at least one of it's output still exists in the current project
      buildRuns.filter(({ outputs }, index) =>
        outputs.some(({ docUrl, heads }) => {
          const doc = files[docUrl];
          return doc && headsMatch(Automerge.getHeads(doc), heads);
        })
      ),
    [buildRuns, files]
  );

  return useMemo<ProjectState>(
    () =>
      !folderDoc || fileUrls.length !== references.length
        ? null
        : {
            references,
            buildRuns: filteredBuildRuns,
          },
    [folderDoc, fileUrls.length, references, filteredBuildRuns]
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
        const svg = viz.renderSVGElement(source);
        container.appendChild(svg);

        // Add click event listeners to all nodes
        svg.querySelectorAll(".node").forEach((node) => {
          const titleElement = node.querySelector("title");
          const nodeIdFromTitle = titleElement
            ? titleElement.textContent
            : null;

          const possibleAutomergeUrl = nodeIdFromTitle
            .slice(1)
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
      const outOfDate = !headsMatch(
        inputReferenceInState.heads,
        input.heads
      );
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
