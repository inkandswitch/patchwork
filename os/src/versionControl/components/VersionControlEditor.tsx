import { useUIStateHandle } from "@/explorer/account";
import { ErrorFallback } from "@/explorer/components/ErrorFallback";
import { DocLinkWithFolderPath, DocPath } from "@/packages/folder/datatype";
import { Tabs, TabsList, TabsTrigger } from "@/shadcn/ui/tabs";
import { EditorProps, Tool } from "@/tools";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import * as A from "@automerge/automerge/next";
import {
  BotIcon,
  ChevronsRight,
  HistoryIcon,
  MessageSquareIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useDataType, useDataTypes } from "../../datatypes";
import { useAnnotations } from "../annotations";
import { useBranchScopeAndActiveBranchInfo } from "../hooks";
import { DiffWithProvenance, HasVersionControlMetadata } from "../schema";
import {
  combinePatches,
  diffWithProvenance,
  useActorIdToAuthorMap,
} from "../utils";
import { StatusBar } from "./Statusbar";
import { VersionControlBar } from "./VersionControlBar";

export type SidebarMode = "review" | "history" | "Bot";

// TODO: provisional until we get rid of DocLinkWithFolderPath
export const fakeDocPath = (
  docLinkWithFolderPath: DocLinkWithFolderPath
): DocPath => {
  return [
    ...docLinkWithFolderPath.folderPath.map((url) => ({
      name: undefined as any,
      type: undefined as any,
      url,
    })),
    docLinkWithFolderPath,
  ];
};

/** A wrapper UI that renders a doc editor with a surrounding branch picker + timeline/annotations sidebar */
export const VersionControlEditor: React.FC<{
  docUrl: AutomergeUrl;
  datatypeId: string;
  tool: Tool;
  addNewDocument: (doc: { type: string; change?: (doc: any) => void }) => void;
  selectedDocLink: DocLinkWithFolderPath;
  flatDocLinks: DocLinkWithFolderPath[];
  getFakeDocPathForDocUrl: (url: AutomergeUrl) => DocPath;
}> = ({
  docUrl: mainDocUrl,
  datatypeId,
  tool,
  addNewDocument,
  selectedDocLink,
  flatDocLinks,
  getFakeDocPathForDocUrl,
}) => {
  const [doc, changeDoc] =
    useDocument<HasVersionControlMetadata<unknown, unknown>>(mainDocUrl);
  const handle =
    useHandle<HasVersionControlMetadata<unknown, unknown>>(mainDocUrl);

  const uiStateHandle = useUIStateHandle();
  const [sessionStartHeads, setSessionStartHeads] = useState<A.Heads>();
  const [isCommentInputFocused, setIsCommentInputFocused] = useState(false);
  const [isHoveringYankToBranchOption, setIsHoveringYankToBranchOption] =
    useState(false);
  const [showChangesFlag, setShowChangesFlag] = useState<boolean>(true);
  const [compareWithMainFlag, setCompareWithMainFlag] =
    useState<boolean>(false);
  const dataTypes = useDataTypes();

  // Reset compare view settings every time you switch branches
  // useEffect(() => {
  //   if (!legacySelectedBranch) {
  //     setCompareWithMainFlag(false);
  //     setShowChangesFlag(false);
  //   } else {
  //     setCompareWithMainFlag(false);
  //     setShowChangesFlag(true);
  //   }
  // }, [JSON.stringify(legacySelectedBranch)]);

  const [sidebarMode, _setSidebarMode] = useState<SidebarMode>();

  const setSidebarMode = (sidebarMode: SidebarMode) => {
    // reset state from history mode
    if (sidebarMode !== "history") {
      setDiffFromTimelineSidebar(undefined);
      setDocHeadsFromTimelineSidebar(undefined);
    }

    _setSidebarMode(sidebarMode);
  };

  const [diffFromTimelineSidebar, setDiffFromTimelineSidebar] =
    useState<DiffWithProvenance>();
  const [docHeadsFromTimelineSidebar, setDocHeadsFromTimelineSidebar] =
    useState<A.Heads>();

  useEffect(() => {
    if (!doc || sessionStartHeads) {
      return;
    }

    setSessionStartHeads(A.getHeads(doc));
  }, [doc, sessionStartHeads]);

  const currentEditSessionDiff = useMemo(() => {
    if (!doc || !sessionStartHeads || !isHoveringYankToBranchOption) {
      return undefined;
    }

    const diff = diffWithProvenance(doc, sessionStartHeads, A.getHeads(doc));

    // todo: generalize
    return {
      ...diff,
      patches: combinePatches(
        diff.patches.filter((patch) => patch.path[0] === "content")
      ),
    };
  }, [doc, sessionStartHeads, isHoveringYankToBranchOption]);

  const actorIdToAuthor = useActorIdToAuthorMap(mainDocUrl);

  const docPath = fakeDocPath(selectedDocLink);

  const branchScopeAndActiveBranchInfo =
    useBranchScopeAndActiveBranchInfo(docPath);
  const { cloneOrMainOm, baseHeads } = branchScopeAndActiveBranchInfo;

  const branchDiff = useMemo(() => {
    if (baseHeads && cloneOrMainOm) {
      return diffWithProvenance(
        cloneOrMainOm.doc,
        baseHeads,
        A.getHeads(cloneOrMainOm.doc)
      );
    }
  }, [baseHeads, cloneOrMainOm]);

  // todo: handle other cases like diff from the timeline
  const diff = branchDiff;

  const buildMetadata = useMemo(() => {
    if (!cloneOrMainOm?.doc) return undefined;
    const allChangesForDoc = A.getAllChanges(cloneOrMainOm.doc);
    const lastChange = A.decodeChange(
      allChangesForDoc[allChangesForDoc.length - 1]
    );
    if (lastChange.message !== undefined) {
      const lastChangeMetadata = JSON.parse(lastChange.message);
      if (lastChangeMetadata?.changeType === "build") {
        return lastChangeMetadata;
      }
    }
    return undefined;
  }, [cloneOrMainOm?.doc]);

  const dataType = useDataType(datatypeId);

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
    doc: cloneOrMainOm?.doc as A.Doc<HasVersionControlMetadata>,
    dataType,
    isCommentInputFocused,
    diff: showChangesFlag ? diff : undefined,
  });

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
          setSidebarMode("review");
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
  }, [selectedAnchors]);

  // init branch metadata when the doc loads if it doesn't have it already
  useEffect(() => {
    if (doc && !doc.branchMetadata) {
      changeDoc(
        (doc) =>
          (doc.branchMetadata = {
            source: null,
            branches: [],
          })
      );
    }
  }, [doc, changeDoc]);

  // ---- ALL HOOKS MUST GO ABOVE THIS EARLY RETURN ----

  if (!cloneOrMainOm || !datatypeId || !doc.branchMetadata)
    return <div>Loading...</div>;

  // ---- ANYTHING RELYING ON doc SHOULD GO BELOW HERE ----

  const branches = doc.branchMetadata.branches ?? [];

  // Currently we can't filter out comments that didn't exist in a previous version of the document
  // this leads to seemingly random places in the document being highlighted. The problem is that
  // the cursor api doesn't provide a way to detect if the op was present it always gives the closest
  // position to that op in the current document.
  //
  // As a short term workaround we filter out all comments if the timeline sidebar is active
  const visibleAnnotations =
    sidebarMode === "history"
      ? annotations.filter((annotation) => annotation.type !== "highlighted")
      : annotations;

  // for now hide inline comments if side by side is enabled because there is not enought space
  const hideInlineComments = !!sidebarMode || compareWithMainFlag;

  const highlightSidebarButton =
    !sidebarMode &&
    annotations.some((a) => a.type === "highlighted" && a.isEmphasized) &&
    (!supportsInlineComments || hideInlineComments);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        <VersionControlBar
          docUrl={mainDocUrl}
          datatypeId={datatypeId}
          branchScopeAndActiveBranchInfo={branchScopeAndActiveBranchInfo}
          buildMetadata={buildMetadata}
          sidebarMode={sidebarMode}
          setSidebarMode={setSidebarMode}
          showChangesFlag={showChangesFlag}
          setShowChangesFlag={setShowChangesFlag}
          compareWithMainFlag={compareWithMainFlag}
          setCompareWithMainFlag={setCompareWithMainFlag}
          highlightSidebarButton={highlightSidebarButton}
          getFakeDocPathForDocUrl={getFakeDocPathForDocUrl}
        />

        {/* Main doc editor pane */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <div className="flex-grow items-stretch justify-stretch relative flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 relative">
              {compareWithMainFlag ? (
                <SideBySide
                  key={cloneOrMainOm.url}
                  tool={tool}
                  docUrl={cloneOrMainOm.url}
                  docHeads={undefined}
                  annotations={visibleAnnotations}
                  annotationGroups={annotationGroups}
                  actorIdToAuthor={actorIdToAuthor}
                  setSelectedAnchors={setSelectedAnchors}
                  setHoveredAnchor={setHoveredAnchor}
                  setHoveredAnnotationGroupId={setHoveredAnnotationGroupId}
                  setSelectedAnnotationGroupId={setSelectedAnnotationGroupId}
                  hideInlineComments={hideInlineComments}
                  setCommentState={setCommentState}
                  getFakeDocPathForDocUrl={getFakeDocPathForDocUrl}
                  mainDocUrl={mainDocUrl}
                  highlightChanges={showChangesFlag}
                />
              ) : (
                <DocEditor
                  key={cloneOrMainOm.url}
                  tool={tool}
                  docUrl={cloneOrMainOm.url}
                  docHeads={undefined}
                  annotations={visibleAnnotations}
                  annotationGroups={annotationGroups}
                  actorIdToAuthor={actorIdToAuthor}
                  setSelectedAnchors={setSelectedAnchors}
                  setHoveredAnchor={setHoveredAnchor}
                  setHoveredAnnotationGroupId={setHoveredAnnotationGroupId}
                  setSelectedAnnotationGroupId={setSelectedAnnotationGroupId}
                  hideInlineComments={hideInlineComments}
                  setCommentState={setCommentState}
                  getFakeDocPathForDocUrl={getFakeDocPathForDocUrl}
                  mainDocUrl={mainDocUrl}
                  highlightChanges={showChangesFlag}
                />
              )}
            </div>
          </div>
        </ErrorBoundary>
        <StatusBar
          dataType={dataType}
          key={cloneOrMainOm.url}
          docUrl={cloneOrMainOm.url}
          docHeads={undefined}
          annotations={visibleAnnotations}
          annotationGroups={annotationGroups}
          actorIdToAuthor={actorIdToAuthor}
          setSelectedAnchors={setSelectedAnchors}
          setHoveredAnchor={setHoveredAnchor}
          setHoveredAnnotationGroupId={setHoveredAnnotationGroupId}
          setSelectedAnnotationGroupId={setSelectedAnnotationGroupId}
          hideInlineComments={hideInlineComments}
          setCommentState={setCommentState}
          addNewDocument={addNewDocument}
          getFakeDocPathForDocUrl={getFakeDocPathForDocUrl}
          mainDocUrl={mainDocUrl}
        />
      </div>

      {sidebarMode && (
        <div className="border-l border-gray-200 py-2 h-full flex flex-col relative bg-gray-50">
          <div
            className="-left-[33px] absolute cursor-pointer hover:bg-gray-100 border hover:border-gray-500 rounded-lg w-[24px] h-[24px] grid place-items-center"
            onClick={() => setSidebarMode(null)}
          >
            <ChevronsRight size={16} />
          </div>

          <div className="px-2 pb-2 flex flex-col gap-2 text-sm font-semibold text-gray-600 border-b border-gray-200">
            <Tabs
              value={sidebarMode}
              onValueChange={(mode) =>
                setSidebarMode(mode as "review" | "history")
              }
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="review">
                  <MessageSquareIcon size={16} className="mr-2" />
                  Review ({annotationGroups.length})
                </TabsTrigger>
                <TabsTrigger value="history">
                  <HistoryIcon size={16} className="mr-2" />
                  History
                </TabsTrigger>
                <TabsTrigger value="Bot">
                  <BotIcon size={16} className="mr-2" />
                  Bot
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="min-h-0 flex-grow w-96">
            {/* {sidebarMode === "history" && (
              <TimelineSidebar
                // set key to trigger re-mount on branch change
                key={selectedCloneUrl}
                dataType={dataType}
                docUrl={selectedCloneUrl}
                setDocHeads={setDocHeadsFromTimelineSidebar}
                setDiff={setDiffFromTimelineSidebar}
                selectedBranch={legacySelectedBranch}
                setSelectedBranch={setSelectedBranch}
              />
            )} */}
            {/* {sidebarMode === "review" && (
              <ReviewSidebar
                doc={activeDoc}
                handle={activeHandle}
                tool={tool}
                annotationGroups={annotationGroups}
                selectedAnchors={selectedAnchors}
                setHoveredAnnotationGroupId={setHoveredAnnotationGroupId}
                setSelectedAnnotationGroupId={setSelectedAnnotationGroupId}
                isCommentInputFocused={isCommentInputFocused}
                setIsCommentInputFocused={setIsCommentInputFocused}
                setCommentState={setCommentState}
              />
            )} */}
            {/* {sidebarMode === "Bot" && (
              <BotSidebar
                doc={activeDoc}
                handle={activeHandle}
                dataType={dataType}
                selectedBranch={legacySelectedBranch}
                setSelectedBranch={setSelectedBranch}
                setSidebarMode={setSidebarMode}
                mergeBranch={handleMergeBranch}
                deleteBranch={handleDeleteBranch}
              />
            )} */}
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
  highlightChanges,
}: EditorPropsWithTool<T, V>) => {
  if (!tool) {
    return;
  }

  const Component = tool.editorComponent;

  return (
    <Component
      docUrl={docUrl}
      docHeads={docHeads}
      annotations={annotations}
      annotationGroups={annotationGroups}
      actorIdToAuthor={actorIdToAuthor}
      hideInlineComments={hideInlineComments}
      setSelectedAnchors={setSelectedAnchors}
      setHoveredAnchor={setHoveredAnchor}
      setSelectedAnnotationGroupId={setSelectedAnnotationGroupId}
      setHoveredAnnotationGroupId={setHoveredAnnotationGroupId}
      setCommentState={setCommentState}
      getFakeDocPathForDocUrl={getFakeDocPathForDocUrl}
      mainDocUrl={mainDocUrl}
      highlightChanges={highlightChanges}
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
