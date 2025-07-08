import { ErrorFallback } from "@patchwork/sdk/components";
import { selectDocLink } from "@patchwork/sdk/router";
import { useDocUIState } from "@patchwork/sdk/router";
import { Icon, IconType } from "@patchwork/sdk/ui";
import { type EditorProps, DataType, DocLink, Tool } from "@patchwork/sdk";
import { useMatchingPluginDescriptions, usePlugin } from "@patchwork/sdk/hooks";
import { useAnnotations } from "@patchwork/sdk/versionControl";
import { useBranchScopeAndActiveBranchInfo } from "@patchwork/sdk/versionControl";
import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { diffWithProvenance } from "@patchwork/sdk/versionControl";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import * as A from "@automerge/automerge";
import React, { useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { FolderDoc } from "./datatype";
import { MountOnlyWhenVisible } from "./MountOnlyWhenVisible";
import { decodeHeads } from "@automerge/automerge-repo";

export const FolderViewerWithEmbeds: React.FC<
  EditorProps<unknown, unknown>
> = ({
  docUrl,
  collapseContentWithoutChanges: collapseContentWithoutAnnotations,
}: EditorProps<unknown, unknown>) => {
  const [folder] = useDocument<FolderDoc>(docUrl); // used to trigger re-rendering when the doc loads

  const [docUIState] = useDocUIState([
    { type: "folder", url: docUrl, name: "PVH TODO: Folder Viewer" },
  ]);

  if (!folder) {
    return null;
  }

  return (
    <div className="p-2 h-full overflow-hidden flex flex-col gap-4">
      <div className="flex border-b border-gray-300 justify-between items-center p-2">
        <div className="text-gray-500 text-sm">
          {folder.docs.length} documents
        </div>
      </div>
      <div className="flex flex-col gap-10 px-4 h-full overflow-y-auto pb-24">
        {folder.docs.map((docLink, index) => (
          <FolderEntryView
            docLink={docLink}
            key={index}
            collapseContentWithoutChanges={
              collapseContentWithoutAnnotations ?? false
            }
            highlightChanges={docUIState.highlightChanges}
          />
        ))}
      </div>
    </div>
  );
};

type FolderEntryView = {
  docLink: DocLink;
  collapseContentWithoutChanges: boolean;
  highlightChanges: boolean;
};

export const FolderEntryView = ({
  docLink,
  collapseContentWithoutChanges,
  highlightChanges,
}: FolderEntryView) => {
  // PVH TODO
  // I'm not pushing down the docPath anymore so we fake it here but this
  // is going to break the branch scope stuff

  /** First, we dereference the branch scope and active branch info from the docLink */
  // This is broken by my removal of docPath.
  const branchState = useBranchScopeAndActiveBranchInfo([docLink]);
  const branchScopeAndActiveBranchInfo =
    branchState.status === "ready" ? branchState.data : undefined;
  const cloneOrMainOm = branchScopeAndActiveBranchInfo?.cloneOrMainOm;

  // Now we get the dataType... for reasons?
  const { plugin: dataType } = usePlugin<DataType>(
    "patchwork:dataType",
    docLink.type
  );

  // Next the tool *descriptions*

  const { plugins: toolDescriptions } = useMatchingPluginDescriptions<Tool>({
    pluginType: "patchwork:tool",
    matchField: "supportedDataTypes",
    matchValue: docLink.type,
  });

  // And now the tool. Okay, that's the full set.
  const { plugin: tool } = usePlugin<Tool>(
    "patchwork:tool",
    toolDescriptions.length > 0 ? toolDescriptions[0].id : "",
    { load: true }
  );

  // Maybe to guess the icon? We should pick a lane here.
  const icon = tool?.icon ?? dataType?.icon;

  // TODO: we shouldn't have to duplicate this code here, also right now the change highlights can't be disabled

  // Alright, for some reason we're calculating diffs here. That's a whole vibe.
  const diff = useMemo(() => {
    if (!branchScopeAndActiveBranchInfo) {
      return;
    }
    const { cloneOrMainOm, baseHeads } = branchScopeAndActiveBranchInfo;
    if (cloneOrMainOm && docLink.url !== cloneOrMainOm.url) {
      return diffWithProvenance(
        cloneOrMainOm.doc,
        baseHeads,
        decodeHeads(cloneOrMainOm.handle.heads())
      );
    }
  }, [branchScopeAndActiveBranchInfo, docLink.url]);

  // And... now annotations? Why are we doing annotations?
  const annotationProps = useAnnotations({
    doc: cloneOrMainOm?.doc as A.Doc<HasVersionControlMetadata>,
    dataType,
    isCommentInputFocused: false,
    showComments: false,
    diff: highlightChanges ? diff : undefined,
  });

  // Annotation ... props? With filtered annotations?
  const annotationPropsWithFilteredAnnotations = useMemo(
    () => ({
      ...annotationProps,
      annotations: collapseContentWithoutChanges
        ? annotationProps.annotations.filter(
            (annotation) => annotation.type !== "highlighted"
          )
        : annotationProps.annotations,
      annotationGroups: collapseContentWithoutChanges
        ? annotationProps.annotationGroups.filter((annotationGroup) =>
            annotationGroup.annotations.some(
              (annotation) => annotation.type !== "highlighted"
            )
          )
        : annotationProps.annotationGroups,
    }),
    [annotationProps, collapseContentWithoutChanges]
  );

  // Handle error state if the branch won't load
  // this is different from the document not loading
  // and honestly this whole thing is a disaster and we should delete all of it
  if (branchState.status === "error") {
    return (
      <div className="h-72">
        <div className="flex gap-2 items-center font-medium mb-1">
          <div>{docLink.name}</div>
        </div>
        <div className="border border-red-300 bg-red-100 text-red-800 p-2">
          Error loading document {docLink.name} ({docLink.url})
        </div>
      </div>
    );
  }

  // The folder viewer can hide unchanged documents
  // ahh, this explains all the business with the annotations.
  // If we don't have annotations (and we've toggled on collapseContent) then we hide this document.
  // This is expensive. Is there a cleaner approach?
  if (
    collapseContentWithoutChanges &&
    annotationProps.annotations.length === 0
  ) {
    return null;
  }

  // And at last, here, we have the tool itself.
  // mainDocUrl is the main-branch url.
  // note that we exclude folders; the recursion would destroy us
  const toolView =
    cloneOrMainOm && tool && docLink.type !== "folder" ? (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <tool.module.EditorComponent
          docUrl={cloneOrMainOm.url}
          collapseContentWithoutChanges={collapseContentWithoutChanges}
          {...annotationPropsWithFilteredAnnotations}
        />
      </ErrorBoundary>
    ) : undefined;

  return (
    <div className="h-72">
      {!tool ? (
        <div className="flex gap-2 items-center font-medium mb-1">
          {docLink.name}
        </div>
      ) : (
        <>
          {/* This is the header bar */}
          <div className="flex gap-2 items-center font-medium mb-1">
            <Icon type={icon as IconType} size={16} />
            <div>{docLink.name}</div>
            <button
              className="text-sm text-gray-500 underline align-bottom cursor-pointer"
              onClick={() => {
                selectDocLink(docLink);
              }}
            >
              Open
            </button>
          </div>

          {/* Here we mount the display -- but only when visible */}
          <div className="border border-gray-300">
            {!tool && <div>No editor available</div>}
            {toolView &&
              (tool.module.supportsCollapseContentWithoutAnnotations &&
              collapseContentWithoutChanges ? (
                toolView
              ) : (
                <MountOnlyWhenVisible height={"16rem"}>
                  {toolView}
                </MountOnlyWhenVisible>
              ))}
            {docLink.type === "folder" && (
              <div className="bg-gray-50 justify-center items-center flex h-full">
                Click "open" to see nested folder contents
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const tool = {
  EditorComponent: FolderViewerWithEmbeds,
  supportsCollapseContentWithoutAnnotations: true,
};
