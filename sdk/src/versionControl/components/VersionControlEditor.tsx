import { dataTypeById } from "../..";
import { useCurrentAccount } from "../..";
import { ErrorFallback } from "../../components/ErrorFallback";
import { LoadingScreen } from "../../components/LoadingScreen";
import { toHashUrl } from "../../router/urls";
import { useDocUIState, useUIStateOm } from "../../router/uiState";
import { useDataTypes } from "../../hooks";
import { DocLink, DocPath } from "@patchwork/folder/datatype";
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { useToast } from "../../ui/use-toast";
import { EditorProps, Tool } from "../..";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import * as A from "@automerge/automerge/next";
import {
  BotIcon,
  ChevronsRight,
  CrownIcon,
  HistoryIcon,
  MessageSquareIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useAnnotations } from "../annotations";
import { mergeBranch, setActiveBranchUrl } from "../branches";
import { useBranchScopeAndActiveBranchInfo } from "../hooks";
import {
  BranchDoc,
  DiffWithProvenance,
  HasVersionControlMetadata,
} from "../schema";
import {
  BranchScopeAndActiveBranchInfo,
  fetchDoesDocLinkExistInBranchScope,
} from "../signals";
import { diffWithProvenance, useActorIdToAuthorMap } from "../utils";
import { BotSidebar } from "./BotSidebar";
import { ReviewSidebar } from "./ReviewSidebar";
import { TimelineSidebar } from "./TimelineSidebar";
import { VersionControlBar } from "./VersionControlBar";
import { useAsyncComputed } from "../../async-signals";

/** A wrapper UI that renders a doc editor with a surrounding branch picker + timeline/annotations sidebar */
export const VersionControlEditor: React.FC<{
  docPath: DocPath;
  tool: Tool;
  addNewDocument: (doc: { type: string; change?: (doc: any) => void }) => void;
  flatDocPaths: DocPath[];
  docHeadsFromTimelineSidebar: A.Heads | undefined;
  setDocHeadsFromTimelineSidebar: (heads: A.Heads | undefined) => void;
}> = ({
  docPath,
  tool,
  docHeadsFromTimelineSidebar,
  setDocHeadsFromTimelineSidebar,
}) => {
  const docLink = DocPath.toLink(docPath);

  const [docUIState, changeDocUIState] = useDocUIState(docPath);

  const uiStateOm = useUIStateOm();
  const account = useCurrentAccount();
  const { toast } = useToast();
  const repo = useRepo();

  const [isCommentInputFocused, setIsCommentInputFocused] = useState(false);

  const [diffFromTimelineSidebar, setDiffFromTimelineSidebar] =
    useState<DiffWithProvenance>();

  const docHeads = docHeadsFromTimelineSidebar ?? undefined;

  // TODO: this mapping should use the branch doc url, not the main doc url
  const actorIdToAuthor = useActorIdToAuthorMap(docLink.url);

  const branchScopeAndActiveBranchInfo =
    useBranchScopeAndActiveBranchInfo(docPath);

  const cloneOrMainOm = branchScopeAndActiveBranchInfo?.cloneOrMainOm;
  const cloneOrMainDocAtHeads =
    cloneOrMainOm?.doc && docHeadsFromTimelineSidebar
      ? A.view(cloneOrMainOm.doc, docHeadsFromTimelineSidebar)
      : cloneOrMainOm?.doc;
  const baseHeads = branchScopeAndActiveBranchInfo?.baseHeads;

  useEffect(() => {
    console.log("Selected doc URL:", docLink.url);
    console.log("CloneOrMainOm URL:", cloneOrMainOm?.url);
  }, [docLink.url, cloneOrMainOm?.url]);

  const branchDiff = useMemo(() => {
    // only compute branch diff if we are on a branch
    if (baseHeads && cloneOrMainOm && cloneOrMainOm.url !== docLink.url) {
      return diffWithProvenance(
        cloneOrMainOm.doc,
        baseHeads,
        A.getHeads(cloneOrMainOm.doc)
      );
    }
  }, [baseHeads, cloneOrMainOm, docLink.url]);

  const diff = diffFromTimelineSidebar ?? branchDiff;

  const dataTypes = useDataTypes();
  const dataType = dataTypeById(dataTypes, docLink.type);

  const branchOms = branchScopeAndActiveBranchInfo?.branchOms;
  const branchScopeUrl = branchScopeAndActiveBranchInfo?.branchScopeOm?.url;

  // backwards compatibility migration:
  // convert old branches that don't have a back link to the branchScope
  useEffect(() => {
    if (!branchScopeUrl || !branchOms) {
      return;
    }

    branchOms.forEach(({ doc, handle }) => {
      if (!doc.branchScopeUrl) {
        handle.change((doc) => {
          doc.branchScopeUrl = branchScopeUrl;
        });
      }
    });
  }, [branchScopeUrl, branchOms]);

  const collapseContentWithoutChanges =
    (docHeads || cloneOrMainOm?.url !== docLink.url) &&
    docUIState.collapseContentWithoutChanges;

  const {
    annotations,
    annotationGroups,
    selectedAnchors,
    setHoveredAnchor,
    setSelectedAnchors,
    setHoveredAnnotationGroupId,
    setSelectedAnnotationGroupId,
    setCommentState,
  } = useAnnotations({
    doc: cloneOrMainDocAtHeads as A.Doc<HasVersionControlMetadata>,
    dataType,
    isCommentInputFocused,
    diff: docUIState.highlightChanges ? diff : undefined,
  });

  const filteredAnnotations = useMemo(
    () =>
      collapseContentWithoutChanges
        ? annotations.filter((annotation) => annotation.type !== "highlighted")
        : annotations,
    [annotations, collapseContentWithoutChanges]
  );

  const filteredAnnotationGroups = useMemo(
    () =>
      collapseContentWithoutChanges
        ? annotationGroups.filter((annotationGroup) =>
            annotationGroup.annotations.some(
              (annotation) => annotation.type !== "highlighted"
            )
          )
        : annotationGroups,
    [annotationGroups, collapseContentWithoutChanges]
  );

  const onSelectBranch = useCallback(
    (branchUrl: AutomergeUrl | null) => {
      if (!branchScopeAndActiveBranchInfo || !uiStateOm) {
        return;
      }

      const { branchScopePath } = branchScopeAndActiveBranchInfo;

      setDiffFromTimelineSidebar(undefined);
      setDocHeadsFromTimelineSidebar(undefined);
      setActiveBranchUrl(uiStateOm, branchScopePath, branchUrl);
    },
    [branchScopeAndActiveBranchInfo, setDocHeadsFromTimelineSidebar, uiStateOm]
  );

  const onChangeSidebarMode = useCallback(
    (mode: string) => {
      changeDocUIState(
        (state) => (state.sidebarMode = mode as "review" | "history" | "bot")
      );
    },
    [changeDocUIState]
  );

  // global comment keyboard shortcut
  // with cmd + shift + m a new comment is created
  const supportsInlineComments = tool.supportsInlineComments;

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.code === "KeyM"
      ) {
        event.preventDefault();
        event.stopPropagation();

        if (!supportsInlineComments || selectedAnchors.length === 0) {
          changeDocUIState((state) => (state.sidebarMode = "review"));
        }

        setCommentState({
          type: "create",
          target: selectedAnchors.length > 0 ? selectedAnchors : undefined,
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress, true);

    return () => {
      window.removeEventListener("keydown", handleKeyPress, true);
    };
  }, [
    selectedAnchors,
    setCommentState,
    supportsInlineComments,
    changeDocUIState,
  ]);

  const onMergeBranch = useCallback(
    async (branchUrl: AutomergeUrl) => {
      if (!account) {
        throw new Error(
          "Cannot merge branch without account information for `mergedBy`"
        );
      }

      const branchHandle = repo.find<BranchDoc>(branchUrl);

      await mergeBranch({
        repo,
        branchHandle,
        mergedBy: account.contactHandle.url,
      });
      onSelectBranch(null);
      toast({ title: "Branch merged to main" });
    },
    [account, repo, onSelectBranch, toast]
  );

  const onDeleteBranch = useCallback(
    (branchUrl: AutomergeUrl) => {
      if (!branchScopeAndActiveBranchInfo) {
        throw new Error("Cannot delete branch without necessary information");
      }

      const { branchScopeVersionControlMetadataOm } =
        branchScopeAndActiveBranchInfo;

      if (!branchScopeVersionControlMetadataOm) {
        throw new Error("Cannot delete branch without branch scope metadata");
      }

      branchScopeVersionControlMetadataOm.handle.change((d) => {
        if (!d.isBranchScope) {
          throw new Error("internal error");
        }
        d.branches = d.branches.filter((b) => b !== branchUrl);
      });

      onSelectBranch(null);
      toast({ title: "Branch deleted" });
    },
    [branchScopeAndActiveBranchInfo, onSelectBranch, toast]
  );

  const doesDocExistInCheckedOutBranchScope = useAsyncComputed(
    useCallback(() => {
      if (!branchScopeAndActiveBranchInfo) {
        return;
      }

      return fetchDoesDocLinkExistInBranchScope(
        DocPath.toLink(docPath),
        repo,
        branchScopeAndActiveBranchInfo,
        dataTypes
      );
    }, [branchScopeAndActiveBranchInfo, dataTypes, docPath, repo])
  ).ifPending(undefined).value;

  // ---- ALL HOOKS MUST GO ABOVE THIS EARLY RETURN ----

  if (!cloneOrMainOm) {
    return <LoadingScreen what="document" />;
  }

  // ---- ANYTHING RELYING ON doc SHOULD GO BELOW HERE ----

  // for now hide inline comments if side by side is enabled because there is not enought space
  const hideInlineComments =
    docUIState.sidebarMode === "review" ||
    docUIState.mainViewMode === "compareWithMain";

  const highlightSidebarButton =
    !docUIState.sidebarMode &&
    annotations.some((a) => a.type === "highlighted" && a.isEmphasized) &&
    (!supportsInlineComments || hideInlineComments);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        {branchScopeAndActiveBranchInfo ? (
          <VersionControlBar
            docPath={docPath}
            tool={tool}
            branchScopeAndActiveBranchInfo={branchScopeAndActiveBranchInfo}
            highlightSidebarButton={highlightSidebarButton}
            onSelectBranch={onSelectBranch}
            diffMode={
              branchScopeAndActiveBranchInfo.activeBranchOm &&
              !diffFromTimelineSidebar
                ? "branch"
                : diffFromTimelineSidebar
                ? "history"
                : undefined
            }
            onMergeBranch={onMergeBranch}
            onDeleteBranch={onDeleteBranch}
          />
        ) : (
          <div>Loading version control information...</div>
        )}

        {/* Main doc editor pane */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          {!doesDocExistInCheckedOutBranchScope && (
            <DocumentNotFoundPage
              branchScopeAndActiveBranchInfo={branchScopeAndActiveBranchInfo}
              docLink={docLink}
            />
          )}
          {doesDocExistInCheckedOutBranchScope && (
            <div className="flex-grow items-stretch justify-stretch relative flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 relative">
                {docUIState.mainViewMode === "compareWithMain" ? (
                  <SideBySide
                    key={cloneOrMainOm.url}
                    tool={tool}
                    docPath={docPath}
                    docUrl={cloneOrMainOm.url}
                    docHeads={docHeads}
                    annotations={filteredAnnotations}
                    annotationGroups={filteredAnnotationGroups}
                    actorIdToAuthor={actorIdToAuthor}
                    setSelectedAnchors={setSelectedAnchors}
                    setHoveredAnchor={setHoveredAnchor}
                    setHoveredAnnotationGroupId={setHoveredAnnotationGroupId}
                    setSelectedAnnotationGroupId={setSelectedAnnotationGroupId}
                    hideInlineComments={hideInlineComments}
                    collapseContentWithoutChanges={
                      collapseContentWithoutChanges
                    }
                    setCommentState={setCommentState}
                    mainDocUrl={docLink.url}
                    activeBranchUrl={
                      branchScopeAndActiveBranchInfo.activeBranchOm?.url
                    }
                  />
                ) : (
                  <DocEditor
                    key={cloneOrMainOm.url}
                    tool={tool}
                    docPath={docPath}
                    docUrl={cloneOrMainOm.url}
                    docHeads={docHeads}
                    annotations={filteredAnnotations}
                    annotationGroups={filteredAnnotationGroups}
                    actorIdToAuthor={actorIdToAuthor}
                    setSelectedAnchors={setSelectedAnchors}
                    setHoveredAnchor={setHoveredAnchor}
                    setHoveredAnnotationGroupId={setHoveredAnnotationGroupId}
                    setSelectedAnnotationGroupId={setSelectedAnnotationGroupId}
                    hideInlineComments={hideInlineComments}
                    collapseContentWithoutChanges={
                      collapseContentWithoutChanges
                    }
                    setCommentState={setCommentState}
                    mainDocUrl={docLink.url}
                    activeBranchUrl={
                      branchScopeAndActiveBranchInfo.activeBranchOm?.url
                    }
                  />
                )}
              </div>
            </div>
          )}
        </ErrorBoundary>
      </div>

      {docUIState.sidebarMode && (
        <div className="border-l border-gray-200 py-2 h-full flex flex-col relative bg-gray-50">
          <div
            className="-left-[33px] absolute cursor-pointer hover:bg-gray-100 border hover:border-gray-500 rounded-lg w-[24px] h-[24px] grid place-items-center"
            onClick={() =>
              changeDocUIState((state) => delete state.sidebarMode)
            }
          >
            <ChevronsRight size={16} />
          </div>

          <div className="px-2 pb-2 flex flex-col gap-2 text-sm font-semibold text-gray-600 border-b border-gray-200">
            <Tabs
              value={docUIState.sidebarMode}
              onValueChange={onChangeSidebarMode}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="review">
                  <MessageSquareIcon size={16} className="mr-2" />
                  Review
                </TabsTrigger>
                <TabsTrigger value="history">
                  <HistoryIcon size={16} className="mr-2" />
                  History
                </TabsTrigger>
                <TabsTrigger value="bot">
                  <BotIcon size={16} className="mr-2" />
                  Bot
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="min-h-0 flex-grow w-96">
            {docUIState.sidebarMode === "history" && dataType && (
              <TimelineSidebar
                // set key to trigger re-mount on branch change
                key={cloneOrMainOm.url}
                dataType={dataType}
                docUrl={cloneOrMainOm.url}
                setDocHeads={setDocHeadsFromTimelineSidebar}
                setDiff={setDiffFromTimelineSidebar}
                branchScopeAndActiveBranchInfo={branchScopeAndActiveBranchInfo}
                onSelectBranchUrl={onSelectBranch}
              />
            )}

            {docUIState.sidebarMode === "review" &&
              cloneOrMainDocAtHeads &&
              cloneOrMainOm && (
                <ReviewSidebar
                  doc={cloneOrMainDocAtHeads}
                  handle={cloneOrMainOm.handle}
                  readonly={!!docHeadsFromTimelineSidebar}
                  tool={tool}
                  annotationGroups={filteredAnnotationGroups}
                  selectedAnchors={selectedAnchors}
                  setHoveredAnnotationGroupId={setHoveredAnnotationGroupId}
                  setSelectedAnnotationGroupId={setSelectedAnnotationGroupId}
                  isCommentInputFocused={isCommentInputFocused}
                  setIsCommentInputFocused={setIsCommentInputFocused}
                  setCommentState={setCommentState}
                />
              )}
            {docUIState.sidebarMode === "bot" &&
              cloneOrMainDocAtHeads &&
              cloneOrMainOm &&
              dataType && (
                <BotSidebar
                  doc={cloneOrMainDocAtHeads}
                  handle={cloneOrMainOm.handle}
                  mainDocUrl={docLink.url}
                  dataType={dataType}
                  selectedBranchUrl={
                    branchScopeAndActiveBranchInfo.activeBranchOm?.url
                  }
                  setSelectedBranch={onSelectBranch}
                  setSidebarMode={onChangeSidebarMode}
                  onMergeBranch={onMergeBranch}
                  onDeleteBranch={onDeleteBranch}
                />
              )}
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentNotFoundPage = ({
  branchScopeAndActiveBranchInfo,
  docLink,
}: {
  branchScopeAndActiveBranchInfo: BranchScopeAndActiveBranchInfo;
  docLink: DocLink;
}) => {
  const selectedBranchName =
    branchScopeAndActiveBranchInfo.activeBranchOm?.doc.name;

  return (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Document not found</h2>
        <p className="text-gray-700 mb-4">
          <span className="bg-white border border-gray-300 shadow-sm px-2 py-1 rounded-md inline-flex gap-1 items-center">
            {!selectedBranchName && <CrownIcon className="inline" size={12} />}
            {selectedBranchName ?? "Main"}
          </span>{" "}
          does not contain the document{" "}
          <span className="font-bold">{docLink.name}</span>.
        </p>
        <p className="text-gray-600">
          It may have been deleted or not yet created on this branch.
        </p>

        <p className="mt-4">
          <a
            href={toHashUrl({
              type: "folder",
              url: branchScopeAndActiveBranchInfo.branchScopeOm.url,
              name: "",
            })}
            className="text-blue-600 hover:underline"
          >
            Go to root of branch
          </a>
        </p>
      </div>
    </div>
  );
};

export interface EditorPropsWithTool<T, V> extends EditorProps<T, V> {
  tool: Tool;
}

/* Wrapper component that dispatches to the tool for the doc type */
const DocEditor = <T, V>({
  tool,
  docPath,
  docUrl,
  docHeads,
  annotations,
  annotationGroups,
  actorIdToAuthor,
  hideInlineComments,
  setSelectedAnchors,
  setHoveredAnchor,
  setSelectedAnnotationGroupId,
  setHoveredAnnotationGroupId,
  setCommentState,
  mainDocUrl,
  activeBranchUrl,
  collapseContentWithoutChanges,
}: EditorPropsWithTool<T, V>) => {
  if (!tool) {
    return;
  }

  const Component = tool.EditorComponent as React.FC<EditorProps<T, V>>;

  return (
    <Component
      docPath={docPath}
      docUrl={docUrl}
      docHeads={docHeads}
      annotations={annotations}
      annotationGroups={annotationGroups}
      actorIdToAuthor={actorIdToAuthor}
      hideInlineComments={hideInlineComments}
      collapseContentWithoutChanges={collapseContentWithoutChanges}
      setSelectedAnchors={setSelectedAnchors}
      setHoveredAnchor={setHoveredAnchor}
      setSelectedAnnotationGroupId={setSelectedAnnotationGroupId}
      setHoveredAnnotationGroupId={setHoveredAnnotationGroupId}
      setCommentState={setCommentState}
      mainDocUrl={mainDocUrl}
      activeBranchUrl={activeBranchUrl}
    />
  );
};

export interface SideBySideProps<T, V> extends EditorPropsWithTool<T, V> {
  mainDocUrl: AutomergeUrl;
}

export const SideBySide = <T, V>(props: SideBySideProps<T, V>) => {
  // special side-by-side view for tldraw with scroll linking
  // todo: add back once modules is gone
  /* if (props.tool.id === "tldraw") {
    return <TLDrawSideBySide {...props} />;
  }*/

  const { mainDocUrl } = props;

  return (
    <div className="flex h-full w-full">
      <div className="h-full flex-1 overflow-auto bg-gray-200">
        {
          <DocEditor
            {...props}
            docUrl={mainDocUrl}
            // note: we don't want to pass in docheads here, the doc heads in the parent
            // should not affect the heads we show for main
            docHeads={undefined}
            annotations={[]}
            annotationGroups={[]}
          />
        }
      </div>
      <div className="h-full flex-1 overflow-auto">
        {<DocEditor {...props} />}
      </div>
    </div>
  );
};
