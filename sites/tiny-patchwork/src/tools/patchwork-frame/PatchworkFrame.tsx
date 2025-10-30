import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { AutomergeUrl } from "@automerge/vanillajs";
import { useDocRef, useSubcontext } from "@patchwork/context/react";
import { IsSelected } from "@patchwork/context/selection";
import { useEffect, useState } from "react";
import { TinyPatchworkAccountDoc } from "../../lib/account-doc";
import { OpenDocumentEvent } from "../../lib/navigation";
import { toolify } from "../../lib/toolify";
import {
  useAddUnknownDocumentsToSidebarEffect,
  useUpdateDocLinksOfActiveDocumentsEffect,
} from "./effects";

export const renderFrame = toolify(
  ({
    docUrl: accountDocUrl,
    element,
  }: {
    docUrl: AutomergeUrl;
    element: HTMLElement | ShadowRoot;
  }) => {
    const [accountDoc, changeAccountDoc] = useDocument<TinyPatchworkAccountDoc>(
      accountDocUrl,
      {
        suspense: true,
      }
    );

    const { rootFolderUrl, accountSidebarToolId, contextSidebarToolId } =
      accountDoc;

    const [mainViewElement, setMainViewElement] = useState<HTMLElement | null>(
      null
    );

    const [selectedView, setSelectedView] = useState<
      { url: AutomergeUrl; toolId?: string } | undefined
    >(undefined);

    const openDocumentRef = useDocRef(selectedView?.url);
    const selectionContext = useSubcontext("SINGLE_VIEW_SELECTION");
    useEffect(() => {
      selectionContext.replace(
        openDocumentRef ? [openDocumentRef.with(IsSelected(true))] : []
      );
    }, [openDocumentRef, selectionContext]);

    const repo = useRepo();

    // Effects
    // this should be probably a plugin type that allows to run code without rendering something

    useUpdateDocLinksOfActiveDocumentsEffect(rootFolderUrl);
    useAddUnknownDocumentsToSidebarEffect(rootFolderUrl);

    // listen to open document events
    useEffect(() => {
      if (!mainViewElement) {
        return;
      }

      const onOpenDocument = (event: OpenDocumentEvent) => {
        event.stopPropagation();
        event.stopImmediatePropagation();

        setSelectedView({ url: event.detail.url, toolId: event.detail.toolId });
      };

      element.addEventListener("patchwork:open-document", onOpenDocument);
      mainViewElement.addEventListener(
        "patchwork:open-document",
        onOpenDocument
      );

      return () => {
        element.removeEventListener("patchwork:open-document", onOpenDocument);
        mainViewElement.removeEventListener(
          "patchwork:open-document",
          onOpenDocument
        );
      };
    }, [changeAccountDoc, element, repo, mainViewElement]);

    return (
      <div className="w-screen h-screen flex" ref={setMainViewElement}>
        <div className="w-[400px] flex flex-col">
          {accountSidebarToolId && (
            <patchwork-view
              class="h-full"
              doc-url={accountDocUrl}
              tool-id={accountSidebarToolId}
            />
          )}
        </div>

        <div className="flex flex-col flex-1 h-full">
          {selectedView && (
            <div className="p-2 bg-base-100 border-base-200 border-l border-r flex items-center gap-2">
              {accountDoc.documentToolbarToolIds?.map((toolId, index) => (
                <patchwork-view
                  doc-url={selectedView.url}
                  tool-id={toolId}
                  key={index}
                />
              ))}
            </div>
          )}
          <div className="flex-1 overflow-auto">
            {selectedView && (
              <patchwork-view
                doc-url={selectedView.url}
                tool-id={selectedView?.toolId}
              />
            )}
            {!selectedView && (
              <div className="flex items-center justify-center h-full text-base-content">
                Select a document in the sidebar
              </div>
            )}
          </div>
        </div>
        {contextSidebarToolId && (
          <div className="w-[400px] bg-base-100">
            <patchwork-view
              doc-url={accountDocUrl}
              tool-id={contextSidebarToolId}
            />
          </div>
        )}
      </div>
    );
  }
);
