import { DataType } from "@patchwork/sdk";
import { useCurrentAccount } from "@patchwork/sdk";
import { ErrorFallback } from "@patchwork/sdk/components";
import { LoadingScreen } from "@patchwork/sdk/components";
import {
  DocPath,
  DocPathUtils,
  useDocUIState,
  useUIStateOm,
} from "@patchwork/sdk/router";
import { useToast } from "@patchwork/sdk/ui";
import { Tool } from "@patchwork/sdk";
import { usePlugin } from "@patchwork/sdk/hooks";

import {
  AutomergeUrl,
  decodeHeads,
  encodeHeads,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
} from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import * as A from "@automerge/automerge";
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
import { diffWithProvenance } from "@patchwork/sdk/versionControl";
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
  docHeads: A.Heads | undefined;
  setDocHeads: (heads: A.Heads | undefined) => void;
}> = ({ docPath, tool, docHeads, setDocHeads }) => {
  const docLink = DocPathUtils.toLink(docPath);

  const [docUIState, changeDocUIState] = useDocUIState(docPath);

  const uiStateOm = useUIStateOm();
  const account = useCurrentAccount();
  const { toast } = useToast();
  const repo = useRepo();

  const [isCommentInputFocused, setIsCommentInputFocused] = useState(false);
  const [showComments, setShowComments] = useState(true);

  const [diffFromTimelineSidebar, setDiffFromTimelineSidebar] =
    useState<DiffWithProvenance>();

  const branchState = useBranchScopeAndActiveBranchInfo(docPath);
  const branchScopeAndActiveBranchInfo =
    branchState.status === "ready" ? branchState.data : undefined;

  const cloneOrMainOm = branchScopeAndActiveBranchInfo?.cloneOrMainOm;
  const cloneOrMainHandleAtHeads =
    cloneOrMainOm?.handle && docHeads
      ? cloneOrMainOm.handle.view(encodeHeads(docHeads))
      : cloneOrMainOm?.handle;
  let baseHeads = branchScopeAndActiveBranchInfo?.baseHeads;

  // PVH hack march 6 2025; some old branches have encoded heads.
  // this is a workaround to allow the branch picker to work.
  // I suspect there are a very small number of documents affected but I want to unblock
  // work until we have a better solution.
  // If it's very long after this you can probably just delete the lines below
  try {
    // @ts-expect-error-next-line some existing documents have bogus encoded baseHeads
    baseHeads = decodeHeads(baseHeads);
    const notOnMainBranch = baseHeads.length > 0;
    if (notOnMainBranch) {
      // If we get to this point, there was actually an encoded baseHeads,
      // which is a bad state.
      console.log("branch may have bogus encoded baseHeads");
    }
  } catch (e) {
    // the expected result is that the decode will fail
  }
  const branchDiff = useMemo(() => {
    // only compute branch diff if we are on a branch
    if (baseHeads && cloneOrMainOm && cloneOrMainOm.url !== docLink.url) {
      return diffWithProvenance(
        cloneOrMainOm.doc,
        baseHeads,
        decodeHeads(cloneOrMainOm.handle.heads())
      );
    }
  }, [baseHeads, cloneOrMainOm, docLink.url]);

  const diff = diffFromTimelineSidebar ?? branchDiff;

  // Use the hook to get and load the data type
  const { plugin: dataType } = usePlugin<DataType>(
    "patchwork:dataType",
    docLink.type
  );

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
    doc: cloneOrMainHandleAtHeads?.doc() as A.Doc<HasVersionControlMetadata>,
    dataType,
    isCommentInputFocused,
    showComments,
    diff: docUIState.highlightChanges ? diff : undefined,
  });

  // Filter highlighted annotations if content is collapsed or if comments are explicitly hidden
  const omitHighlightAnnotations =
    collapseContentWithoutChanges || !showComments;

  const filteredAnnotations = useMemo(
    () =>
      omitHighlightAnnotations
        ? annotations.filter((annotation) => annotation.type !== "highlighted")
        : annotations,
    [annotations, omitHighlightAnnotations]
  );

  const filteredAnnotationGroups = useMemo(
    () =>
      omitHighlightAnnotations
        ? annotationGroups.filter((annotationGroup) =>
            annotationGroup.annotations.some(
              (annotation) => annotation.type !== "highlighted"
            )
          )
        : annotationGroups,
    [annotationGroups, omitHighlightAnnotations]
  );

  const onSelectBranch = useCallback(
    (branchUrl: AutomergeUrl | null) => {
      if (!branchScopeAndActiveBranchInfo || !uiStateOm) {
        return;
      }

      const { branchScopePath } = branchScopeAndActiveBranchInfo;

      setDiffFromTimelineSidebar(undefined);
      setDocHeads(undefined);
      setActiveBranchUrl(uiStateOm, branchScopePath, branchUrl);
    },
    [branchScopeAndActiveBranchInfo, setDocHeads, uiStateOm]
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
  const supportsInlineComments = tool.module.supportsInlineComments;

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

  // Handle error state
  if (branchState.status === "error") {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm px-8">
        <div className="min-w-0 overflow-x-auto max-w-[50ch]">
          The document "{docLink.name}" (
          <span className="font-mono text-xs bg-gray-100 rounded px-1">
            {docLink.url}
          </span>
          ) is currently unavailable.
          {navigator.onLine ? (
            <div className="mt-2">
              This means there are no devices you're connected to which are able
              to share this document. It could also reflect a sync issue.
            </div>
          ) : (
            <div className="mt-2">
              Since you are offline, it's possible that this document will
              become available once you reconnect.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!cloneOrMainOm || !cloneOrMainHandleAtHeads) {
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
            showComments={showComments}
            onSetShowComments={setShowComments}
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
                    key={cloneOrMainHandleAtHeads.url}
                    tool={tool}
                    docPath={docPath}
                    docUrl={cloneOrMainHandleAtHeads.url}
                    annotations={filteredAnnotations}
                    annotationGroups={filteredAnnotationGroups}
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
                    key={cloneOrMainHandleAtHeads.url}
                    tool={tool}
                    docPath={docPath}
                    docUrl={cloneOrMainHandleAtHeads.url}
                    annotations={filteredAnnotations}
                    annotationGroups={filteredAnnotationGroups}
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
          setDocHeads,
          setDiffFromTimelineSidebar,
          branchScopeAndActiveBranchInfo,
          onSelectBranch,
          cloneOrMainDocAtHeads: cloneOrMainHandleAtHeads?.doc(),
          docHeads,
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
