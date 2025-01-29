import { dataTypeById } from "@patchwork/sdk";
import { useCurrentAccount } from "@patchwork/sdk";
import { ErrorFallback } from "@patchwork/sdk/components";
import { LoadingScreen } from "@patchwork/sdk/components";
import { useDocUIState, useUIStateOm } from "@patchwork/sdk/router";
import { DocPath, DocPathUtils } from "@patchwork/folder";
import { useToast } from "@patchwork/sdk/ui";
import { Tool } from "@patchwork/sdk";

import { AutomergeUrl } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { next as A } from "@automerge/automerge";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useAnnotations } from "@patchwork/sdk/versionControl";
import { mergeBranch, setActiveBranchUrl } from "@patchwork/sdk/versionControl";
import { useBranchScopeAndActiveBranchInfo } from "@patchwork/sdk/versionControl";
import {
  BranchDoc,
  DiffWithProvenance,
  HasVersionControlMetadata,
} from "@patchwork/sdk/versionControl";
import { fetchDoesDocLinkExistInBranchScope } from "@patchwork/sdk/versionControl";
import {
  diffWithProvenance,
  useActorIdToAuthorMap,
} from "@patchwork/sdk/versionControl";
import { VersionControlBar } from "./VersionControlBar";
import { useAsyncComputed } from "@patchwork/sdk/async-signals";
import { DocEditor } from "./DocEditor";
import { SideBySide } from "./SideBySide";
import { VersionControlSidebar } from "./sidebar/VersionControlSidebar";
import { DocumentNotFoundPage } from "./DocumentNotFoundPage";

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
  const docLink = DocPathUtils.toLink(docPath);

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

  // useEffect(() => {
  //   console.log("Selected doc URL:", docLink.url);
  //   console.log("CloneOrMainOm URL:", cloneOrMainOm?.url);
  // }, [docLink.url, cloneOrMainOm?.url]);

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

  const dataType = dataTypeById(docLink.type);

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

      const branchHandle = await repo.find<BranchDoc>(branchUrl);

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
        DocPathUtils.toLink(docPath),
        repo,
        branchScopeAndActiveBranchInfo
      );
    }, [branchScopeAndActiveBranchInfo, docPath, repo])
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
        <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[tool]}>
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

      <VersionControlSidebar
        {...{
          docUIState,
          changeDocUIState,
          onChangeSidebarMode,
          dataType,
          cloneOrMainOm,
          setDocHeadsFromTimelineSidebar,
          setDiffFromTimelineSidebar,
          branchScopeAndActiveBranchInfo,
          onSelectBranch,
          cloneOrMainDocAtHeads,
          docHeadsFromTimelineSidebar,
          tool,
          filteredAnnotationGroups,
          selectedAnchors,
          setHoveredAnnotationGroupId,
          setSelectedAnnotationGroupId,
          isCommentInputFocused,
          setIsCommentInputFocused,
          setCommentState,
          docLink,
          onMergeBranch,
          onDeleteBranch,
        }}
      />
    </div>
  );
};
