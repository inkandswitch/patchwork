import { next as A } from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { DocLink } from "@patchwork/folder";
import { DataType, Tool } from "@patchwork/sdk";
import { Om } from "@patchwork/sdk/om";
import { DocUIState } from "@patchwork/sdk/router/uiState";
import { Tabs, TabsList, TabsTrigger } from "@patchwork/sdk/ui";
import {
  HasVersionControlMetadata,
  DiffWithProvenance,
  BranchScopeAndActiveBranchInfo,
  AnnotationGroupWithUIState,
  CommentState,
} from "@patchwork/sdk/versionControl";
import {
  ChevronsRight,
  MessageSquareIcon,
  HistoryIcon,
  BotIcon,
} from "lucide-react";
import { TimelineSidebar, ReviewSidebar, BotSidebar } from "..";

export interface VersionControlSidebarProps {
  docUIState: DocUIState;
  changeDocUIState: (fn: (state: DocUIState) => void) => void;
  onChangeSidebarMode: (mode: string) => void;
  dataType: DataType<unknown, unknown, unknown> | undefined;
  cloneOrMainOm: Om<HasVersionControlMetadata>;
  setDocHeadsFromTimelineSidebar: (heads: A.Heads | undefined) => void;
  setDiffFromTimelineSidebar: React.Dispatch<
    React.SetStateAction<DiffWithProvenance | undefined>
  >;
  branchScopeAndActiveBranchInfo: BranchScopeAndActiveBranchInfo;
  onSelectBranch: (branchUrl: AutomergeUrl | null) => void;
  cloneOrMainDocAtHeads: A.Doc<HasVersionControlMetadata> | undefined;
  docHeadsFromTimelineSidebar: A.Heads | undefined;
  tool: Tool;
  filteredAnnotationGroups: AnnotationGroupWithUIState<unknown, unknown>[];
  selectedAnchors: unknown[];
  setHoveredAnnotationGroupId: (id: string | undefined) => void;
  setSelectedAnnotationGroupId: (id: string | undefined) => void;
  isCommentInputFocused: boolean;
  setIsCommentInputFocused: React.Dispatch<React.SetStateAction<boolean>>;
  setCommentState: (state: CommentState<unknown> | undefined) => void;
  docLink: DocLink;
  onMergeBranch: (branchUrl: AutomergeUrl) => Promise<void>;
  onDeleteBranch: (branchUrl: AutomergeUrl) => void;
}

export function VersionControlSidebar({
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
}: VersionControlSidebarProps) {
  return (
    docUIState.sidebarMode && (
      <div className="border-l border-gray-200 py-2 h-full flex flex-col relative bg-gray-50">
        <div
          className="-left-[33px] absolute cursor-pointer hover:bg-gray-100 border hover:border-gray-500 rounded-lg w-[24px] h-[24px] grid place-items-center"
          onClick={() => changeDocUIState((state) => delete state.sidebarMode)}
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
    )
  );
}
