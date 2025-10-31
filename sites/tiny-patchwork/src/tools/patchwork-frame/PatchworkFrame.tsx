import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import {
  AutomergeUrl,
  DocHandle,
  encodeHeads,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
} from "@automerge/vanillajs";
import {
  useDocRef,
  useReactive,
  useSubcontext,
} from "@patchwork/context/react";
import { IsSelected } from "@patchwork/context/selection";
import { useEffect, useMemo, useState } from "react";
import { TinyPatchworkAccountDoc } from "../../lib/account-doc";
import { OpenDocumentEvent } from "../../lib/navigation";
import {
  useAddUnknownDocumentsToSidebarEffect,
  useUpdateDocLinksOfActiveDocumentsEffect,
} from "./effects";
import { DocWithComments, getStoredThreads } from "@patchwork/context/comments";
import { getViewHeads } from "@patchwork/context/diff";

export const PatchworkFrame = ({
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
    mainViewElement.addEventListener("patchwork:open-document", onOpenDocument);

    return () => {
      element.removeEventListener("patchwork:open-document", onOpenDocument);
      mainViewElement.removeEventListener(
        "patchwork:open-document",
        onOpenDocument
      );
    };
  }, [changeAccountDoc, element, repo, mainViewElement]);

  // Add current handle to window
  useEffect(() => {
    (window as any).handle = selectedDocRef?.docHandle;
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
        <div className="flex-1 overflow-auto">
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
        <div className="w-[400px] bg-base-100">
          <patchwork-view
            doc-url={accountDocUrl}
            tool-id={contextSidebarToolId}
          />
        </div>
      )}
      <div className="w-[400px] bg-base-100">
        <patchwork-view
          doc-url={accountDocUrl}
          tool-id={contextSidebarToolId}
        />
      </div>
    </div>
  );
};
