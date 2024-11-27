import { ErrorFallback } from "@/explorer/components/ErrorFallback";
import { selectDocLink } from "@/explorer/router";
import { useDocUIState } from "@/explorer/uiState";
import { Icon, IconType } from "@/lib/icons";
import { dataTypeById, useDataTypes, useTools } from "@patchwork/sdk";
import { EditorProps, Tool, toolsForDataType } from "@patchwork/sdk";
import { useAnnotations } from "@patchwork/sdk/versionControl";
import { useBranchScopeAndActiveBranchInfo } from "@patchwork/sdk/versionControl";
import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { diffWithProvenance } from "@patchwork/sdk/versionControl";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import * as A from "@automerge/automerge/next";
import React, { useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { DocPath, FolderDoc } from "./datatype";
import { MountOnlyWhenVisible } from "./MountOnlyWhenVisible";

export const FolderViewerWithEmbeds: React.FC<
  EditorProps<unknown, unknown>
> = ({
  docPath,
  docUrl,
  docHeads,
  collapseContentWithoutChanges: collapseContentWithoutAnnotations,
}: EditorProps<unknown, unknown>) => {
  const [folder] = useDocument<FolderDoc>(docUrl); // used to trigger re-rendering when the doc loads
  const folderAtHeads = folder && docHeads ? A.view(folder, docHeads) : folder;

  const [docUIState] = useDocUIState(docPath);

  if (!folder || !folderAtHeads) {
    return null;
  }

  return (
    <div className="p-2 h-full overflow-hidden flex flex-col gap-4">
      <div className="flex border-b border-gray-300 justify-between items-center p-2">
        <div className="text-gray-500 text-sm">
          {folderAtHeads.docs.length} documents
        </div>
      </div>
      <div className="flex flex-col gap-10 px-4 h-full overflow-y-auto pb-24">
        {folderAtHeads.docs.map((docLink, index) => (
          <FolderEntryView
            docPath={[...docPath, docLink]}
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
  docPath: DocPath;
  collapseContentWithoutChanges: boolean;
  highlightChanges: boolean;
};

export const FolderEntryView = ({
  docPath,
  collapseContentWithoutChanges,
  highlightChanges,
}: FolderEntryView) => {
  const docLink = DocPath.toLink(docPath);
  const branchScopeAndActiveBranchInfo =
    useBranchScopeAndActiveBranchInfo(docPath);
  const cloneOrMainOm = branchScopeAndActiveBranchInfo?.cloneOrMainOm;

  const dataTypes = useDataTypes();
  const dataType = dataTypeById(dataTypes, docLink.type);

  const tools = useTools();
  const tool = toolsForDataType(tools, docLink.type)[0];

  const icon = tool?.icon ?? dataType?.icon;

  // TODO: we shouldn't have to duplicate this code here, also right now the change highlights can't be disabled
  const diff = useMemo(() => {
    if (!branchScopeAndActiveBranchInfo) {
      return;
    }
    const { cloneOrMainOm, baseHeads } = branchScopeAndActiveBranchInfo;
    if (cloneOrMainOm && docLink.url !== cloneOrMainOm.url) {
      return diffWithProvenance(
        cloneOrMainOm.doc,
        baseHeads,
        A.getHeads(cloneOrMainOm.doc)
      );
    }
  }, [branchScopeAndActiveBranchInfo, docLink.url]);

  const annotationProps = useAnnotations({
    doc: cloneOrMainOm?.doc as A.Doc<HasVersionControlMetadata>,
    dataType,
    isCommentInputFocused: false,
    diff: highlightChanges ? diff : undefined,
  });

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

  if (
    collapseContentWithoutChanges &&
    annotationProps.annotations.length === 0
  ) {
    return null;
  }

  const toolView =
    cloneOrMainOm && tool && docLink.type !== "folder" ? (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <tool.EditorComponent
          docPath={docPath}
          docUrl={cloneOrMainOm.url}
          mainDocUrl={docLink.url}
          collapseContentWithoutChanges={collapseContentWithoutChanges}
          {...annotationPropsWithFilteredAnnotations}
        />
      </ErrorBoundary>
    ) : undefined;

  return (
    <div className="h-72">
      {!tool ? (
        <div className="flex gap-2 items-center font-medium mb-1">
          Unknown type: {docLink.type}
        </div>
      ) : (
        <>
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

          <div className="border border-gray-300">
            {!tool && <div>No editor available</div>}
            {toolView &&
              (tool.supportsCollapseContentWithoutAnnotations &&
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

export const folderViewerWithEmbedsTool: Tool = {
  type: "patchwork:tool",
  id: "folder-embeds",
  name: "Embeds",
  EditorComponent: FolderViewerWithEmbeds,
  supportedDataTypes: ["folder"],
  supportsCollapseContentWithoutAnnotations: true,
};
