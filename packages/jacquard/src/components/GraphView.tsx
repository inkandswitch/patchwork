import {
  fetchAwaitMissing,
  useAsyncComputed,
} from "@patchwork/sdk/async-signals";
import { useCurrentAccount } from "@patchwork/sdk";
import { selectDocLink } from "@patchwork/sdk";
import { EditorProps } from "@patchwork/sdk";
import { AutomergeUrl, isValidAutomergeUrl } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { instance } from "@viz-js/viz";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JacquardBuildMetadata } from "../datatype";
import {
  getReferenceFromDocUrl,
  getStalenessInfo,
  headsMatch,
  ProjectState,
  reasonToString,
} from "../getStalenessInfo";
import { fetchJacquardProjectInfoWithActiveBranch } from "../hooks";
import { fetchProjectStateFromProjectInfo } from "../signals";

// @ts-expect-error some environments don't have import.meta.glob
const rawSvgIcons = import.meta.glob
  ? import.meta.glob("../file-icon-vectors/*.svg", {
      eager: true,
      import: "default",
    })
  : [];

let svgIconsByFileExtension: Record<string, string> = {};

for (let [key, value] of Object.entries(rawSvgIcons)) {
  const fileExtension =
    key
      .split("/")
      .pop()
      ?.replace(/\.svg$/, "") || "";
  svgIconsByFileExtension[fileExtension] = value as string;
}

export const GraphView = ({
  docPath,
}: EditorProps<JacquardBuildMetadata, never>) => {
  const repo = useRepo();
  const account = useCurrentAccount();

  return useAsyncComputed(
    useCallback(() => {
      fetchAwaitMissing(account);
      const jacquardProjectInfo = fetchJacquardProjectInfoWithActiveBranch(
        docPath,
        account,
        repo
      );
      if (!jacquardProjectInfo) {
        return "Cannot find Jacquard project info";
      }
      const projectState = fetchProjectStateFromProjectInfo(
        jacquardProjectInfo,
        repo
      );
      return (
        <div className="p-4 flex flex-col h-full overflow-auto">
          <GraphvizView source={stateGraphSrc(projectState)} />
          {false && (
            <pre className="text-sm overflow-y-auto">
              {JSON.stringify(
                jacquardProjectInfo?.buildMetadataOm.doc.refreshState,
                null,
                2
              )}
            </pre>
          )}
        </div>
      );
    }, [account, docPath, repo])
  ).ifPending(undefined).value;
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

          const nodeType = isValidAutomergeUrl(possibleAutomergeUrl)
            ? "doc"
            : "build";

          if (nodeType === "build") {
            (node as SVGElement).style.cursor = "default";
            return;
          }

          (node as SVGElement).style.cursor = "pointer";

          // Get the filename from the child text node
          const labelElement = node.querySelector("text");

          // Determine the file extension
          const fileExtension =
            (labelElement?.textContent ?? "").split(".").pop()?.toLowerCase() ||
            "";

          // Render file icon SVG
          const iconImage = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "image"
          );
          iconImage.setAttribute(
            "href",
            svgIconsByFileExtension[fileExtension] ??
              svgIconsByFileExtension["blank"]
          );
          iconImage.setAttribute("width", "24");
          iconImage.setAttribute("height", "24");

          // Get the bounding box of the node
          const nodeBBox = (node as SVGGraphicsElement).getBBox();

          // Position the icon near the top-left corner of the node
          const iconX = nodeBBox.x - 12; // 12 is half the icon width
          const iconY = nodeBBox.y - 12; // 12 is half the icon height

          iconImage.setAttribute("x", iconX.toString());
          iconImage.setAttribute("y", iconY.toString());

          node.appendChild(iconImage);

          // Add hover effect
          const path = node.querySelector("path");
          if (path) {
            const originalFill = (path as SVGPathElement).style.fill;

            node.addEventListener("mouseenter", () => {
              (path as SVGPathElement).style.fill = "#f3f4f6"; // Light gray
            });

            node.addEventListener("mouseleave", () => {
              (path as SVGPathElement).style.fill = originalFill; // Reset to original color
            });
          }

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
      shape=rect
      label=${JSON.stringify(reference.path)}
      fontsize=10
      fontname="Merriweather Sans, sans-serif"
      height=0.3
      tooltip="${status.map(reasonToString).join("; ")}"
      ${
        status.length > 0
          ? 'style="filled,rounded" fillcolor="#fcc" color="#c00"'
          : 'style="filled,rounded" fillcolor="#ffffff" color="#cccccc"'
      }
      margin="0.3,0.1"
    ];`);
  }
  for (let buildRun of state.buildRuns) {
    const status = stalenessInfo.buildRunStatuses[buildRun.id];
    lines.push(`${gvId(buildRun.id)} [
      shape=rect
      label=${JSON.stringify(
        "⚙️ " + (buildRun.spec.name ?? buildRun.spec.command)
      )}
      fontname=${
        buildRun.spec.name
          ? '"Merriweather Sans, sans-serif"'
          : '"Courier, monospace"'
      }
      fontsize=${buildRun.spec.name ? 12 : 10}
      tooltip="${status.map(reasonToString).join("; ")}"
      margin="0.2,0.1"
      style="filled"
      fillcolor=${status.length > 0 ? '"#fcc"' : '"#d7ebf5"'}
      color=${status.length > 0 ? '"#c00"' : '"#bbb"'}
      penwidth=1.5

    ];`);
    for (let input of buildRun.inputs) {
      const inputReferenceInState = getReferenceFromDocUrl(state, input.docUrl);
      const outOfDate = !headsMatch(inputReferenceInState.heads, input.heads);
      lines.push(`${gvId(input.docUrl)} -> ${gvId(buildRun.id)} [
        color=${outOfDate ? '"#fcc"' : '"#888"'}
        style=${outOfDate ? '"dashed"' : '"solid"'}
        penwidth=0.5
        arrowsize=0.7
        arrowhead="vee"
      ];`);
    }
    for (let output of buildRun.outputs) {
      lines.push(`${gvId(buildRun.id)} -> ${gvId(output.docUrl)} [
        color="#888"
        penwidth=0.5
        arrowsize=0.7
        arrowhead="vee"
      ];`);
    }
  }

  const source = `digraph {
    graph [pad="0.3"];
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
