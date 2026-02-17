import { makeDocumentProjection } from "@automerge/automerge-repo-solid-primitives";
import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type { DocWithComments } from "@inkandswitch/annotations-comments";
import type { TinyPatchworkConfigDoc } from "./types";
import {
  useSidebarState,
  useSidebarResize,
  useSelectedDocument,
  useAnnotations,
  useCommentThreads,
  useDebugRegistryToast,
  DebugRegistryToast,
} from "./hooks";
import { Sidebar } from "./components/Sidebar";
import { DocumentToolbar } from "./components/DocumentToolbar";
import { MainDocumentView } from "./components/MainDocumentView";
import "./styles.css";

// Sidebar dimensions
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 600;
const DRAG_THRESHOLD = 3;

export const PatchworkFrame = ({
  handle,
  element,
  repo,
}: {
  handle: DocHandle<TinyPatchworkConfigDoc>;
  element: HTMLElement | ShadowRoot;
  repo: Repo;
}) => {
  const accountDoc = makeDocumentProjection(handle);
  const accountDocUrl = handle.url;

  // Sidebar state management
  const sidebarState = useSidebarState();

  // Sidebar resize handlers
  const { handleMouseDown, handleToggleClick } = useSidebarResize({
    setLeftSidebarWidth: sidebarState.setLeftSidebarWidth,
    setRightSidebarWidth: sidebarState.setRightSidebarWidth,
    setIsSidebarCollapsed: sidebarState.setIsSidebarCollapsed,
    setIsRightSidebarCollapsed: sidebarState.setIsRightSidebarCollapsed,
    minWidth: MIN_SIDEBAR_WIDTH,
    maxWidth: MAX_SIDEBAR_WIDTH,
    dragThreshold: DRAG_THRESHOLD,
  });

  // Selected document management
  const selectedDoc = useSelectedDocument({
    element,
    repo,
  });

  // Comment threads for selected document
  const commentThreadsWithRef = useCommentThreads(
    () =>
      selectedDoc.selectedDocHandle() as DocHandle<DocWithComments> | undefined,
    repo
  );

  // Annotations management
  useAnnotations({
    selectedDocRef: selectedDoc.selectedDocRef,
    commentThreadsWithRef,
  });

  // Debug registry toast
  const {
    events: debugEvents,
    dismissEvent,
    clearAll,
  } = useDebugRegistryToast();

  return (
    <div class="w-screen h-screen flex">
      <DebugRegistryToast
        events={debugEvents()}
        onDismiss={dismissEvent}
        onClearAll={clearAll}
      />

      {/* Left Sidebar */}
      {accountDoc.accountSidebarToolId && (
        <Sidebar
          side="left"
          isCollapsed={sidebarState.isSidebarCollapsed}
          width={sidebarState.leftSidebarWidth}
          toolId={accountDoc.accountSidebarToolId}
          docUrl={accountDocUrl}
          onMouseDown={handleMouseDown}
          onToggleClick={handleToggleClick}
        />
      )}

      {/* Main Content Area */}
      <div class="flex flex-col flex-1 h-full">
        <DocumentToolbar
          toolIds={accountDoc.documentToolbarToolIds}
          docUrl={selectedDoc.selectedDocUrl}
        />
        <MainDocumentView
          viewKey={selectedDoc.viewKey}
          selectedDocUrl={selectedDoc.selectedDocUrl}
          toolId={() => selectedDoc.selectedView()?.toolId}
        />
      </div>

      {/* Right Sidebar */}
      {accountDoc.contextSidebarToolId && (
        <Sidebar
          side="right"
          isCollapsed={sidebarState.isRightSidebarCollapsed}
          width={sidebarState.rightSidebarWidth}
          toolId={accountDoc.contextSidebarToolId}
          docUrl={accountDocUrl}
          onMouseDown={handleMouseDown}
          onToggleClick={handleToggleClick}
        />
      )}
    </div>
  );
};
