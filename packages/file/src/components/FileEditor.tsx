import { getDR, ifLoaded, useDocReactive, waitForDR } from "@/doc-reactive";
import { TextAnchor } from "@/lib/textAnchors";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { EditorProps } from "@/tools";
import * as Automerge from "@automerge/automerge";
import {
  parseAutomergeUrl,
  type AutomergeUrl,
} from "@automerge/automerge-repo";
import {
  useDocument,
  useDocuments,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import React, { useCallback, useMemo, useState } from "react";
import {
  BuildRefreshButton,
  DisabledBuildRefreshButton,
} from "../../../jacquard/src/components/BuildRefreshButton";
import {
  getLastBuildRun,
  getProjectStateFromProjectInfo,
} from "../../../jacquard/src/signals";
import { FileDoc } from "../datatype";
import { ImageFileDoc, ImageFileViewer, isImageFile } from "./ImageFileViewer";
import { PDFFileDoc, PDFFileViewer, isPDFFile } from "./PDFFileViewer";
import { TextFileEditor, isTextFile } from "./TextFileEditor";
import { resolveUrlOnBranch } from "@/versionControl/signals";
import { useJacquardProjectInfoWithActiveBranch } from "../../../jacquard/src/hooks";
import { getStalenessInfo } from "../../../jacquard/src/getStalenessInfo";
import { getRelativeTimeString } from "@/lib/dates";
import {
  AlertTriangleIcon,
  ArrowDownToLineIcon,
  ArrowRightCircle,
  ArrowRightFromLineIcon,
  ArrowRightToLineIcon,
  ArrowUpFromLineIcon,
  BadgeCheckIcon,
  FileIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/shadcn/ui/dropdown-menu";
import { Button } from "@/shadcn/ui/button";
import { FitsFileDoc, FitsFileViewer, isFitsFile } from "./FitsFileViewer";

// TODO: this should be split out into separate tools that
// for that we need to extend the suppportsDatatype mechanism and turn it into a function
// that gets passed in the content of the document so you can determine based on the content
// if this tool supports the data type

export const FileEditor = (props: EditorProps<unknown, unknown>) => {
  const {
    docUrl,
    docHeads,
    getFakeDocPathForDocUrl,
    mainDocUrl,
    activeBranchUrl,
  } = props;

  const [_doc] = useDocument<FileDoc>(docUrl);
  const [showSourceFiles, setShowDependencies] = useState(false);

  const doc = _doc && docHeads ? Automerge.view(_doc, docHeads) : _doc;

  const repo = useRepo();
  const buildMetadata = ifLoaded(
    useDocReactive(
      "buildMetadata",
      useCallback(
        () => getLastBuildRun(docUrl, repo, docHeads),
        [docUrl, repo, docHeads]
      )
    )
  );

  const buildMetadataInputsOnBranch = ifLoaded(
    useDocReactive(
      "buildMetadataInputsOnBranch",
      useCallback(() => {
        getDR(buildMetadata);
        return buildMetadata?.inputs.map((input) =>
          activeBranchUrl
            ? {
                ...input,
                docUrl: resolveUrlOnBranch(input.docUrl, activeBranchUrl, repo)
                  .url,
                mainDocUrl: input.docUrl,
              }
            : { ...input, mainDocUrl: input.docUrl }
        );
      }, [buildMetadata, activeBranchUrl, repo])
    )
  );

  const jacquardProjectInfo = useJacquardProjectInfoWithActiveBranch(
    getFakeDocPathForDocUrl(mainDocUrl)
  );

  const projectState = ifLoaded(
    useDocReactive(
      useCallback(() => {
        waitForDR(jacquardProjectInfo);

        if (!jacquardProjectInfo) {
          return;
        }

        return getProjectStateFromProjectInfo(jacquardProjectInfo, repo);
      }, [jacquardProjectInfo, repo])
    )
  );

  const stalenessInfo = projectState
    ? getStalenessInfo(projectState)
    : undefined;

  const isStale =
    stalenessInfo?.docStatuses[mainDocUrl] &&
    stalenessInfo?.docStatuses[mainDocUrl].length > 0;

  if (!doc) {
    return null;
  }

  const enableRefreshButton =
    jacquardProjectInfo?.buildMetadataOm &&
    (isStale ||
      (jacquardProjectInfo.buildMetadataOm.doc.refreshState &&
        jacquardProjectInfo.buildMetadataOm.doc.refreshState.type !== "idle"));

  const fileView = (
    <>
      {isTextFile(doc) ? (
        React.createElement(
          TextFileEditor,
          props as EditorProps<TextAnchor, string>
        )
      ) : (
        <>
          {isImageFile(doc) ? (
            <div className="overflow-auto h-full p-4">
              {React.createElement(
                ImageFileViewer,
                props as EditorProps<ImageFileDoc, never>
              )}
            </div>
          ) : isPDFFile(doc) ? (
            <div className="overflow-auto h-full">
              {React.createElement(
                PDFFileViewer,
                props as EditorProps<PDFFileDoc, never>
              )}
            </div>
          ) : isFitsFile(doc) ? (
            <div className="overflow-auto h-full p-4">
              {React.createElement(
                FitsFileViewer,
                props as EditorProps<FitsFileDoc, never>
              )}
            </div>
          ) : (
            <div className="p-4">No preview for file</div>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="h-full flex flex-col">
      {buildMetadata && (
        <div className="bg-gray-100 pl-4 py-1 text-sm flex gap-2 items-center border-b border-gray-200 cursor-default">
          {enableRefreshButton ? (
            <BuildRefreshButton
              projectBuildMetadataOm={jacquardProjectInfo.buildMetadataOm}
              projectState={projectState}
              alignTooltip="start"
            />
          ) : (
            <DisabledBuildRefreshButton />
          )}
          <div className="text-xs text-gray-500">
            {isStale && <span>needs refresh</span>}
            {!isStale && <span>up to date</span>}, last built{" "}
            {getRelativeTimeString(buildMetadata.timestamp)}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                <FileIcon className="mr-2 h-4 w-4" />
                Show just this file
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Display options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <FileIcon className="mr-2 h-4 w-4" />
                Show just this file
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ArrowRightToLineIcon className="mr-2 h-4 w-4" />
                Show with build inputs
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ArrowRightFromLineIcon className="mr-2 h-4 w-4" />
                Show with build outputs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center mr-1 ml-auto">
            <Checkbox
              id="diff-overlay-checkbox"
              className="mr-1"
              checked={showSourceFiles}
              onCheckedChange={() => setShowDependencies((flag) => !flag)}
            />
            <label htmlFor="diff-overlay-checkbox">show source files</label>
          </div>
        </div>
      )}

      <div className="overflow-auto h-full">
        {buildMetadataInputsOnBranch &&
          showSourceFiles &&
          buildMetadataInputsOnBranch.map((input) => (
            <div>
              <div className="flex border-t border-gray-200 p-2">
                <div className="rounded-md px-1  text-gray-500  border border-gray-500">
                  {input.path}
                </div>
              </div>
              <div className="max-h-[200px] overflow-auto">
                <FileEditor
                  docUrl={input.docUrl}
                  docHeads={input.heads}
                  getFakeDocPathForDocUrl={getFakeDocPathForDocUrl}
                  mainDocUrl={input.mainDocUrl}
                  activeBranchUrl={activeBranchUrl}
                />
              </div>
            </div>
          ))}

        {showSourceFiles ? (
          <div>
            <div className="flex border-t border-gray-200 p-2">
              <div className="rounded-md px-1  text-gray-500  border border-gray-500">
                {doc.name}
              </div>
            </div>
            {fileView}
          </div>
        ) : (
          fileView
        )}
      </div>
    </div>
  );
};
