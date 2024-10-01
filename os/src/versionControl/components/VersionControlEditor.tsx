import { ErrorFallback } from "@/explorer/components/ErrorFallback";
import { LoadingScreen } from "@/explorer/components/LoadingScreen";
import { useDocUIState, useUIStateOm } from "@/explorer/uiState";
import { DocLinkWithFolderPath, DocPath } from "@/packages/folder/datatype";
import { useDataTypes } from "@/hooks/useDataTypes";
import { Tabs, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { EditorProps, Tool } from "@/tools";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import * as A from "@automerge/automerge/next";
import {
  BotIcon,
  ChevronsRight,
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
import { diffWithProvenance, useActorIdToAuthorMap } from "../utils";
import { ReviewSidebar } from "./ReviewSidebar";
import { TimelineSidebar } from "./TimelineSidebar";
import { VersionControlBar } from "./VersionControlBar";
import { dataTypeById } from "@/datatypes";
import { fakeDocPath } from "../signals";
import { BotSidebar } from "./BotSidebar";
import { useCurrentAccount } from "@/explorer/account";
import { useToast } from "@/shadcn/ui/use-toast";
import { Om } from "@/om";

/** A wrapper UI that renders a doc editor with a surrounding branch picker + timeline/annotations sidebar */
export const VersionControlEditor: React.FC<{
  mainDocUrl: AutomergeUrl;
  datatypeId: string;
  tool: Tool;
  addNewDocument: (doc: { type: string; change?: (doc: any) => void }) => void;
  selectedDocLink: DocLinkWithFolderPath;
  flatDocLinks: DocLinkWithFolderPath[];
  getFakeDocPathForDocUrl: (url: AutomergeUrl) => DocPath;
  docHeadsFromTimelineSidebar: A.Heads | undefined;
  setDocHeadsFromTimelineSidebar: (heads: A.Heads | undefined) => void;
}> = ({
  mainDocUrl,
  datatypeId,
  tool,
  selectedDocLink,
  getFakeDocPathForDocUrl,
  docHeadsFromTimelineSidebar,
  setDocHeadsFromTimelineSidebar,
}) => {
  const [docUIState, changeDocUIState] = useDocUIState(
    getFakeDocPathForDocUrl(mainDocUrl)
  );

  const uiStateOm = useUIStateOm();

  const [isCommentInputFocused, setIsCommentInputFocused] = useState(false);

  const [diffFromTimelineSidebar, setDiffFromTimelineSidebar] =
    useState<DiffWithProvenance>();

  const docHeads = docHeadsFromTimelineSidebar ?? undefined;

  // TODO: IDK what this is, but should it use a branched doc?
  const actorIdToAuthor = useActorIdToAuthorMap(mainDocUrl);

  const docPath = useMemo(
    () => fakeDocPath(selectedDocLink),
    [selectedDocLink]
  );

  const branchScopeAndActiveBranchInfo =
    useBranchScopeAndActiveBranchInfo(docPath);

  const cloneOrMainOm = branchScopeAndActiveBranchInfo?.cloneOrMainOm;
  const cloneOrMainDocAtHeads =
    cloneOrMainOm?.doc && docHeadsFromTimelineSidebar
      ? A.view(cloneOrMainOm.doc, docHeadsFromTimelineSidebar)
      : cloneOrMainOm?.doc;
  const baseHeads = branchScopeAndActiveBranchInfo?.baseHeads;

  const branchDiff = useMemo(() => {
    // only compute branch diff if we are on a branch
    if (baseHeads && cloneOrMainOm && cloneOrMainOm.url !== mainDocUrl) {
      return diffWithProvenance(
        cloneOrMainOm.doc,
        baseHeads,
        A.getHeads(cloneOrMainOm.doc)
      );
    }
  }, [mainDocUrl, baseHeads, cloneOrMainOm]);

  const diff = diffFromTimelineSidebar ?? branchDiff;

  const dataTypes = useDataTypes();
  const dataType = dataTypeById(dataTypes, datatypeId);

  const branchOms = branchScopeAndActiveBranchInfo?.branchOms;
  const branchScopeUrl = branchScopeAndActiveBranchInfo?.branchScopeOm?.url;

  // hack: convert old branches that don't have a back link to the branchScope
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
    (docHeads || cloneOrMainOm?.url !== mainDocUrl) &&
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

  const account = useCurrentAccount();
  const { toast } = useToast();
  const repo = useRepo();

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

  // ---- ALL HOOKS MUST GO ABOVE THIS EARLY RETURN ----

  if (!cloneOrMainOm || !datatypeId) {
    return <LoadingScreen docUrl={mainDocUrl} handle={cloneOrMainOm?.handle} />;
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
            docUrl={mainDocUrl}
            datatypeId={datatypeId}
            tool={tool}
            branchScopeAndActiveBranchInfo={branchScopeAndActiveBranchInfo}
            highlightSidebarButton={highlightSidebarButton}
            getFakeDocPathForDocUrl={getFakeDocPathForDocUrl}
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
          <div className="flex-grow items-stretch justify-stretch relative flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 relative">
              {docUIState.mainViewMode === "compareWithMain" ? (
                <SideBySide
                  key={cloneOrMainOm.url}
                  tool={tool}
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
                  collapseContentWithoutChanges={collapseContentWithoutChanges}
                  setCommentState={setCommentState}
                  getFakeDocPathForDocUrl={getFakeDocPathForDocUrl}
                  mainDocUrl={mainDocUrl}
                  activeBranchUrl={
                    branchScopeAndActiveBranchInfo.activeBranchOm?.url
                  }
                />
              ) : (
                <DocEditor
                  key={cloneOrMainOm.url}
                  tool={tool}
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
                  collapseContentWithoutChanges={collapseContentWithoutChanges}
                  setCommentState={setCommentState}
                  getFakeDocPathForDocUrl={getFakeDocPathForDocUrl}
                  mainDocUrl={mainDocUrl}
                  activeBranchUrl={
                    branchScopeAndActiveBranchInfo.activeBranchOm?.url
                  }
                />
              )}
            </div>
          </div>
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
                  mainDocUrl={mainDocUrl}
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

export interface EditorPropsWithTool<T, V> extends EditorProps<T, V> {
  tool: Tool;
}

/* Wrapper component that dispatches to the tool for the doc type */
const DocEditor = <T, V>({
  tool,
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
  getFakeDocPathForDocUrl,
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
      getFakeDocPathForDocUrl={getFakeDocPathForDocUrl}
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

// const BranchActions: React.FC<{
//   doc: HasVersionControlMetadata<unknown, unknown>;
//   branchDoc: HasVersionControlMetadata<unknown, unknown>;
//   branchUrl: AutomergeUrl;
//   handleDeleteBranch: (branchUrl: AutomergeUrl) => void;
//   handleRenameBranch: (branchUrl: AutomergeUrl, newName: string) => void;
//   handleRebaseBranch: (branchUrl: AutomergeUrl) => void;
//   handleMergeBranch: (branchUrl: AutomergeUrl) => void;
// }> = ({
//   doc,
//   branchDoc,
//   branchUrl,
//   handleDeleteBranch,
//   handleRenameBranch,
//   handleRebaseBranch,
//   handleMergeBranch,
// }) => {
//   const branchHeads = useMemo(
//     () => (branchDoc ? JSON.stringify(A.getHeads(branchDoc)) : undefined),
//     [branchDoc]
//   );
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);

//   // compute new name suggestions anytime the branch heads change
//   // todo: seems like this should run outside of the react UI...
//   useEffect(() => {
//     if (!dropdownOpen || !doc || !branchDoc) return;
//     if (!isMarkdownDoc(doc) || !isMarkdownDoc(branchDoc)) {
//       console.warn("suggestions only work for markdown docs");
//       return;
//     }
//     if (!isLLMActive) return;
//     setNameSuggestions([]);
//     (async () => {
//       const suggestions = (
//         await suggestBranchName({ doc, branchUrl, branchDoc })
//       ).split("\n");
//       setNameSuggestions(suggestions);
//     })();
//   }, [doc, branchDoc, branchUrl, branchHeads, dropdownOpen]);

//   return (
//     <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
//       <DropdownMenuTrigger>
//         <MoreHorizontal
//           size={18}
//           className="mt-1 mr-21 text-gray-500 hover:text-gray-800"
//         />
//       </DropdownMenuTrigger>
//       <DropdownMenuContent className="mr-4 w-72">
//         <DropdownMenuItem
//           onClick={() => {
//             navigator.clipboard.writeText(window.location.href).then(
//               () => {
//                 toast("Link copied to clipboard");
//               },
//               () => {
//                 toast.error("Failed to copy link to clipboard");
//               }
//             );
//           }}
//         >
//           <Link className="inline-block text-gray-500 mr-2" size={14} /> Copy
//           link to branch
//         </DropdownMenuItem>
//         <DropdownMenuItem
//           onClick={() => {
//             const newName = prompt("Enter the new name for this branch:");
//             if (newName && newName.trim() !== "") {
//               handleRenameBranch(branchUrl, newName.trim());
//             }
//           }}
//         >
//           <Edit3Icon className="inline-block text-gray-500 mr-2" size={14} />{" "}
//           Rename branch
//         </DropdownMenuItem>
//         <DropdownMenuItem
//           onClick={() => {
//             handleRebaseBranch(branchUrl);
//           }}
//         >
//           <GitBranchPlusIcon
//             className="inline-block text-gray-500 mr-2"
//             size={14}
//           />{" "}
//           Incorporate updates from main
//         </DropdownMenuItem>
//         <DropdownMenuItem
//           onClick={() => {
//             handleMergeBranch(branchUrl);
//           }}
//         >
//           <GitMergeIcon className="inline-block text-gray-500 mr-2" size={14} />{" "}
//           Merge branch
//         </DropdownMenuItem>
//         <DropdownMenuItem
//           onClick={() => {
//             if (
//               window.confirm("Are you sure you want to delete this branch?")
//             ) {
//               handleDeleteBranch(branchUrl);
//             }
//           }}
//         >
//           <Trash2Icon className="inline-block text-gray-500 mr-2" size={14} />{" "}
//           Delete branch
//         </DropdownMenuItem>
//         <DropdownMenuSeparator></DropdownMenuSeparator>
//         {isLLMActive && (
//           <DropdownMenuGroup>
//             <DropdownMenuLabel>Suggested renames:</DropdownMenuLabel>
//             {nameSuggestions.length === 0 && (
//               <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
//             )}
//             {nameSuggestions.map((suggestion) => (
//               <DropdownMenuItem
//                 key={suggestion}
//                 onClick={() => {
//                   handleRenameBranch(branchUrl, suggestion);
//                 }}
//               >
//                 {suggestion}
//               </DropdownMenuItem>
//             ))}
//           </DropdownMenuGroup>
//         )}
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// };
