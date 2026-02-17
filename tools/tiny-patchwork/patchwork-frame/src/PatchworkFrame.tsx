import {
  useDocHandle,
  useDocument,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import { DocHandle } from "@automerge/automerge-repo";
import {
  AutomergeUrl,
  encodeHeads,
  isValidDocumentId,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
} from "@automerge/vanillajs";
import { OpenDocumentEvent } from "@inkandswitch/patchwork-elements";
import { AnnotationSet } from "@inkandswitch/annotations";
import { annotations as globalAnnotations } from "@inkandswitch/annotations-context";
import { ViewHeads } from "@inkandswitch/annotations-diff";
import { IsSelected } from "@inkandswitch/annotations-selection";
import { useSubscribe } from "@inkandswitch/subscribables-react";
import { ref, RefOfType } from "@inkandswitch/patchwork-refs";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useUpdateDocLinksOfActiveDocumentsEffect } from "./effects";
import "./styles.css";
import { TinyPatchworkConfigDoc } from "./types";
import {
  DebugRegistryToast,
  useDebugRegistryToast,
} from "./useDebugRegistryToast";
import {
  CommentThread,
  DocWithComments,
  SerializedCommentThread,
} from "@inkandswitch/annotations-comments";
import { commentThreadsWithRefOfDoc } from "@inkandswitch/annotations-comments";

export const PatchworkFrame = ({
  docUrl: accountDocUrl,
  element,
}: {
  docUrl: AutomergeUrl;
  element: HTMLElement | ShadowRoot;
}) => {
  const [accountDoc, changeAccountDoc] = useDocument<TinyPatchworkConfigDoc>(
    accountDocUrl,
    {
      suspense: true,
    }
  );

  const { rootFolderUrl, accountSidebarToolId, contextSidebarToolId } =
    accountDoc;

  const [selectedView, setSelectedView] = useState<
    { url: AutomergeUrl; toolId?: string } | undefined
  >(undefined);

  // Sidebar state with localStorage persistence (read once on mount, no subscription to other tabs)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("patchwork:leftSidebarCollapsed");
    return stored === "true";
  });
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("patchwork:rightSidebarCollapsed");
    return stored === "true";
  });

  // Resizable sidebar state with localStorage persistence
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(() => {
    const stored = localStorage.getItem("patchwork:leftSidebarWidth");
    return stored ? parseInt(stored, 10) : 400;
  });
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() => {
    const stored = localStorage.getItem("patchwork:rightSidebarWidth");
    return stored ? parseInt(stored, 10) : 400;
  });
  const isResizing = useRef<"left" | "right" | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem(
      "patchwork:leftSidebarCollapsed",
      String(isSidebarCollapsed)
    );
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem(
      "patchwork:rightSidebarCollapsed",
      String(isRightSidebarCollapsed)
    );
  }, [isRightSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem(
      "patchwork:leftSidebarWidth",
      String(leftSidebarWidth)
    );
  }, [leftSidebarWidth]);

  useEffect(() => {
    localStorage.setItem(
      "patchwork:rightSidebarWidth",
      String(rightSidebarWidth)
    );
  }, [rightSidebarWidth]);

  const handleMouseDown = useCallback(
    (side: "left" | "right", e: React.MouseEvent) => {
      e.preventDefault();
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      hasDragged.current = false;
      isResizing.current = side;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    isResizing.current = null;
    dragStartPos.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !dragStartPos.current) return;

    // Check if we've moved enough to consider it a drag (threshold: 3px)
    const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.current.y);
    if (deltaX > 3 || deltaY > 3) {
      hasDragged.current = true;
    }

    if (isResizing.current === "left") {
      const newWidth = Math.max(200, Math.min(600, e.clientX));
      setLeftSidebarWidth(newWidth);
    } else if (isResizing.current === "right") {
      const newWidth = Math.max(
        200,
        Math.min(600, window.innerWidth - e.clientX)
      );
      setRightSidebarWidth(newWidth);
    }
  }, []);

  const handleToggleClick = useCallback(
    (side: "left" | "right", e: React.MouseEvent) => {
      // Only toggle if we didn't drag
      if (hasDragged.current) {
        e.preventDefault();
        e.stopPropagation();
        // Reset the flag for next interaction
        hasDragged.current = false;
        return;
      }

      if (side === "left") {
        setIsSidebarCollapsed(!isSidebarCollapsed);
      } else {
        setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
      }
    },
    [isSidebarCollapsed, isRightSidebarCollapsed]
  );

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Debug registry toast
  const {
    events: debugEvents,
    dismissEvent,
    clearAll,
  } = useDebugRegistryToast();

  const selectedDocHandle = useDocHandle(selectedView?.url);
  const selectedDocRef = useMemo(
    () => (selectedDocHandle ? ref(selectedDocHandle) : undefined),
    [selectedDocHandle]
  );

  const selectedDocAnnotations = useSubscribe(
    useMemo(
      () =>
        selectedDocRef ? globalAnnotations.onRef(selectedDocRef) : undefined,
      [selectedDocRef]
    )
  );

  const viewHeads = selectedDocAnnotations?.lookup(ViewHeads);

  const selectedDocUrl = useMemo(() => {
    if (!selectedView?.url) {
      return undefined;
    }

    if (!viewHeads) {
      return selectedView.url;
    }

    const currentDocumentId = parseAutomergeUrl(selectedView.url).documentId;
    return stringifyAutomergeUrl({
      documentId: currentDocumentId,
      heads: encodeHeads(viewHeads.afterHeads),
    });
  }, [selectedView?.url, viewHeads]);

  //  Contribute annotations to the global context
  const commentThreadsWithRef = useCommentThreadsWithRefOfDoc(
    selectedDocHandle as DocHandle<DocWithComments>
  );
  const annotations = useMemo(() => new AnnotationSet(), []);
  useEffect(() => {
    if (!selectedDocRef) {
      return;
    }

    globalAnnotations.add(annotations);

    annotations.change(() => {
      annotations.clear();

      // selection
      annotations.add(selectedDocRef, IsSelected(true));

      // comment threads
      for (const [threadRef, thread] of commentThreadsWithRef) {
        for (const ref of thread.refs) {
          if (threadRef.value()?.isResolved) {
            continue;
          }

          annotations.add(ref, CommentThread(threadRef));
        }
      }
    });

    return () => {
      globalAnnotations.remove(annotations);
    };
  }, [
    annotations,
    selectedDocAnnotations,
    selectedDocRef,
    commentThreadsWithRef,
  ]);

  const repo = useRepo();

  // Effects
  // this should be probably a plugin type that allows to run code without rendering something

  useUpdateDocLinksOfActiveDocumentsEffect(rootFolderUrl);
  //todo disabling this until it supports folders
  // useAddUnknownDocumentsToSidebarEffect(rootFolderUrl);

  // listen to open document events
  useEffect(() => {
    const onOpenDocument = (event: OpenDocumentEvent) => {
      event.stopPropagation();
      event.stopImmediatePropagation();

      setSelectedView({ url: event.detail.url, toolId: event.detail.toolId });
    };

    element.addEventListener(
      "patchwork:open-document",
      onOpenDocument as EventListener
    );

    // Process any document already specified in the URL hash on initial mount,
    // since the patchwork:mounted event fires before this listener is ready.
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const documentId = params.get("doc");
    const toolId = params.get("tool") || undefined;
    const headsParam = params.get("heads");
    const heads = headsParam ? headsParam.split("|") : undefined;
    if (isValidDocumentId(documentId)) {
      setSelectedView({
        url: stringifyAutomergeUrl({ documentId, heads }),
        toolId,
      });
    }

    return () => {
      (element as HTMLElement).removeEventListener(
        "patchwork:open-document",
        onOpenDocument
      );
    };
  }, [changeAccountDoc, element, repo]);

  // Add current handle to window
  useEffect(() => {
    (window as any).currentDocHandle = selectedDocRef?.docHandle;
  }, [selectedDocRef]);

  return (
    <div className="w-screen h-screen flex">
      <DebugRegistryToast
        events={debugEvents}
        onDismiss={dismissEvent}
        onClearAll={clearAll}
      />
      <div
        className={`flex relative ${isSidebarCollapsed ? "w-0" : ""}`}
        style={{ width: isSidebarCollapsed ? 0 : leftSidebarWidth }}
      >
        {/* Account sidebar */}
        {accountSidebarToolId && !isSidebarCollapsed && (
          <patchwork-view
            class="h-full"
            doc-url={accountDocUrl}
            tool-id={accountSidebarToolId}
          />
        )}
        {!isSidebarCollapsed && (
          <button
            onClick={(e) => handleToggleClick("left", e)}
            onMouseDown={(e) => handleMouseDown("left", e)}
            className="sidebar-toggle sidebar-toggle--resizable"
            aria-label="Toggle or resize sidebar"
            title="Click to toggle, drag to resize"
          />
        )}
        {isSidebarCollapsed && (
          <button
            onClick={(e) => handleToggleClick("left", e)}
            className="sidebar-toggle"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          />
        )}
      </div>
      <div className="flex flex-col flex-1 h-full">
        {/* Document toolbar */}
        {selectedDocUrl && (
          <div className="p-2 bg-base-200 border-b border-base-300 flex items-center gap-2 flex-start">
            {accountDoc.documentToolbarToolIds?.map((toolId, index) => (
              <patchwork-view
                class="!w-fit !h-8 !overflow-hidden !flex"
                doc-url={selectedDocUrl}
                tool-id={toolId}
                key={index}
              />
            ))}
          </div>
        )}
        {/* Main document view */}
        <div className="w-full flex-1 min-h-0">
          {selectedDocUrl && (
            <patchwork-view
              doc-url={selectedDocUrl}
              tool-id={selectedView?.toolId}
            />
          )}
          {!selectedDocUrl && (
            <div className="flex items-center justify-center h-full text-base-content">
              Select a document in the sidebar
            </div>
          )}
        </div>
      </div>
      {/* Context sidebar */}
      {contextSidebarToolId && (
        <div
          className={`flex relative bg-base-100 ${
            isRightSidebarCollapsed ? "w-[2px]" : ""
          }`}
          style={{ width: isRightSidebarCollapsed ? 2 : rightSidebarWidth }}
        >
          {!isRightSidebarCollapsed && (
            <button
              onClick={(e) => handleToggleClick("right", e)}
              onMouseDown={(e) => handleMouseDown("right", e)}
              className="sidebar-toggle sidebar-toggle--resizable"
              aria-label="Toggle or resize sidebar"
              title="Click to toggle, drag to resize"
            />
          )}
          {isRightSidebarCollapsed && (
            <button
              onClick={(e) => handleToggleClick("right", e)}
              className="sidebar-toggle"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            />
          )}
          {!isRightSidebarCollapsed && (
            <patchwork-view
              doc-url={accountDocUrl}
              tool-id={contextSidebarToolId}
            />
          )}
        </div>
      )}
    </div>
  );
};

export const useCommentThreadsWithRefOfDoc = (
  docHandle?: DocHandle<DocWithComments>
) => {
  const repo = useRepo();
  const [doc] = useDocument(docHandle?.url);
  const [commentThreadsWithRef, setCommentThreadsWithRef] = useState<
    [RefOfType<SerializedCommentThread>, CommentThread][]
  >([]);

  useEffect(() => {
    let cancelled = false;
    if (!docHandle) {
      return;
    }

    commentThreadsWithRefOfDoc(docHandle, repo).then((threadsWithRef) => {
      if (cancelled) {
        return;
      }
      setCommentThreadsWithRef(threadsWithRef);
    });

    return () => {
      cancelled = true;
    };
  }, [docHandle, repo, doc]);

  return commentThreadsWithRef;
};
