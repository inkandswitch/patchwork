import "./styles.css";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import {
  AutomergeUrl,
  DocHandle,
  encodeHeads,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
} from "@automerge/vanillajs";
import { DocWithComments, getStoredThreads } from "@patchwork/context-comments";
import { getViewHeads } from "@patchwork/context-diff";
import {
  useDocRef,
  useReactive,
  useSubcontext,
} from "@patchwork/context-react";
import { IsSelected } from "@patchwork/context-selection";
import { useEffect, useMemo, useState } from "react";
import { TinyPatchworkConfigDoc } from "./types";
import { OpenDocumentEvent } from "@patchwork/elements";
import { useUpdateDocLinksOfActiveDocumentsEffect } from "./effects";

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

  const [selectedDoc] = useDocument<DocWithComments>(selectedView?.url);
  const selectedDocRef = useDocRef(selectedView?.url);

  const viewHeads = useReactive(
    useMemo(
      () => (selectedDocRef ? getViewHeads(selectedDocRef) : undefined),
      [selectedDocRef]
    )
  );

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

  // add selected doc to context
  const selectionContext = useSubcontext("SINGLE_VIEW_SELECTION");
  useEffect(() => {
    selectionContext.replace(
      selectedDocRef ? [selectedDocRef.with(IsSelected(true))] : []
    );
  }, [selectedDocRef, selectionContext]);

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

  // Add comments to context
  const commentsContext = useSubcontext("SINGLE_VIEW_COMMENTS");
  useEffect(() => {
    void selectedDoc;

    if (!selectedView || !selectedDocRef || !selectedDocRef.docHandle) {
      return;
    }

    const storedThreads = getStoredThreads(
      selectedDocRef.docHandle as DocHandle<DocWithComments>
    );

    commentsContext.replace(storedThreads);
  }, [commentsContext, selectedView, selectedDocRef, selectedDoc]);

  return (
    <div className="w-screen h-screen flex">
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
          <div className="p-2 bg-base-200 border-b border-base-300 flex items-center gap-2">
            {accountDoc.documentToolbarToolIds?.map((toolId, index) => (
              <patchwork-view
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
