import {
  useDocHandle,
  useDocument,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import {
  AutomergeUrl,
  DocHandle,
  encodeHeads,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
} from "@automerge/vanillajs";
import { DocWithComments, getStoredThreads } from "@patchwork/context-comments";
import { ViewHeads } from "@patchwork/annotations-diff";
import { IsSelected } from "@patchwork/annotations-selection";
import { annotations } from "@patchwork/annotations-context";
import { useObservable } from "@patchwork/observable-react";
import { ref } from "@patchwork/refs";
import { OpenDocumentEvent } from "@patchwork/elements";
import { useEffect, useMemo, useState } from "react";
import { useUpdateDocLinksOfActiveDocumentsEffect } from "./effects";
import "./styles.css";
import { TinyPatchworkConfigDoc } from "./types";
import {
  DebugRegistryToast,
  useDebugRegistryToast,
} from "./useDebugRegistryToast";
import { AnnotationSet } from "@patchwork/annotations";

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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

  // Debug registry toast
  const {
    events: debugEvents,
    dismissEvent,
    clearAll,
  } = useDebugRegistryToast();

  const [selectedDoc] = useDocument<DocWithComments>(selectedView?.url);
  const selectedDocHandle = useDocHandle(selectedView?.url);
  const selectedDocRef = useMemo(
    () => (selectedDocHandle ? ref(selectedDocHandle) : undefined),
    [selectedDocHandle]
  );
  const selectedDocAnnotations = useObservable(
    useMemo(() => {
      const result = selectedDocRef
        ? annotations.onRef(selectedDocRef)
        : undefined;

      return result;
    }, [selectedDocRef])
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

  // add selected doc to global annotations
  useEffect(() => {
    if (!selectedDocRef) {
      return;
    }

    const selection = new AnnotationSet();
    selection.add(selectedDocRef, IsSelected(true));

    annotations.add(selection);

    return () => {
      annotations.remove(selection);
    };
  }, [selectedDocRef]);

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
        className={`flex relative transition-all duration-300 ${
          isSidebarCollapsed ? "w-0" : "w-[400px]"
        }`}
      >
        {accountSidebarToolId && !isSidebarCollapsed && (
          <patchwork-view
            class="h-full"
            doc-url={accountDocUrl}
            tool-id={accountSidebarToolId}
          />
        )}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="sidebar-toggle"
          aria-label={
            isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        />
      </div>
      <div className="flex flex-col flex-1 h-full">
        {selectedDocUrl && (
          <div className="p-2 bg-base-200 border-b border-base-300 flex items-center gap-2 flex-start">
            {accountDoc.documentToolbarToolIds?.map((toolId, index) => (
              <patchwork-view
                class="!w-fit"
                doc-url={selectedDocUrl}
                tool-id={toolId}
                key={index}
              />
            ))}
          </div>
        )}
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
      {contextSidebarToolId && (
        <div
          className={`flex relative transition-all duration-300 bg-base-100 ${
            isRightSidebarCollapsed ? "w-[2px]" : "w-[400px]"
          }`}
        >
          <button
            onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
            className="sidebar-toggle"
            aria-label={
              isRightSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={
              isRightSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          />
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
