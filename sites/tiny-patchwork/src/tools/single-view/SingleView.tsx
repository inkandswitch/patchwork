import { docIdFromAutomergeUrl } from "@automerge/automerge-repo-keyhive";
import {
  AutomergeUrl,
  DocHandle,
  encodeHeads,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
} from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import {
  useDocRef,
  useReactive,
  useSubcontext,
} from "@patchwork/context/react";
import { IsSelected } from "@patchwork/context/selection";
import { KeyhiveKit } from "@patchwork/identity";
import { useEffect, useMemo } from "react";
import { OpenDocumentEvent } from "../../lib/navigation";
import { toolify } from "../../lib/toolify";
import { SingleViewDoc } from "./datatype";
import { Diff, getDiffOfDoc, getViewHeads } from "@patchwork/context/diff";
import { RefWith } from "@patchwork/context";
import {
  DocWithComments,
  getStoredThreads,
  ThreadField,
} from "@patchwork/context/comments";

const SingleView = ({
  docUrl,
  element,
  keyhiveKit,
}: {
  docUrl: AutomergeUrl;
  element: HTMLElement | ShadowRoot;
  keyhiveKit?: KeyhiveKit;
}) => {
  const [singleViewDoc, changeSingleViewDoc] = useDocument<SingleViewDoc>(
    docUrl,
    {
      suspense: true,
    }
  );

  const selectionContext = useSubcontext("SINGLE_VIEW");

  const { currentDocument } = singleViewDoc;

  // Get the current document reference for context
  const currentDocRef = useDocRef(currentDocument?.url);

  // get view heads
  const viewHeads = useReactive(getViewHeads(currentDocRef));

  // Update selection context when current document changes
  useEffect(() => {
    console.log("!! set currentDocRef in single view", currentDocRef);
    selectionContext.replace(
      currentDocRef ? [currentDocRef.with(IsSelected(true))] : []
    );
  }, [currentDocRef, selectionContext]);

  // Compute diffs when on a branch with highlight changes enabled
  const diffsOfDoc = useMemo<RefWith<Diff>[]>(() => {
    if (!currentDocRef || !viewHeads) {
      return [];
    }

    return getDiffOfDoc(
      currentDocRef.docHandle.view(encodeHeads(viewHeads.afterHeads)),
      viewHeads.beforeHeads
    );
  }, [currentDocRef, viewHeads]);

  const diffContext = useSubcontext("SINGLE_VIEW_DIFF");
  useEffect(() => {
    diffContext.replace(diffsOfDoc);
  }, [diffContext, diffsOfDoc]);

  // Listen for open document events
  useEffect(() => {
    if (element) {
      const handleOpenDocument = (event: Event) => {
        const { docLink } = event as OpenDocumentEvent;
        console.log("single view: handle open document event", event);

        changeSingleViewDoc((doc) => {
          // Simply replace the current document
          doc.currentDocument = docLink;
        });
      };

      element.addEventListener("patchwork:open-document", handleOpenDocument);
      return () => {
        element.removeEventListener(
          "patchwork:open-document",
          handleOpenDocument
        );
      };
    }
  }, [changeSingleViewDoc, element]);

  // add doc handle to window
  useEffect(() => {
    if (currentDocRef) {
      (window as any).currentDoc = currentDocRef.docHandle;
    }
  }, [currentDocRef]);

  let hasAccess = false;

  if (currentDocument) {
    const id = keyhiveKit!.active.individual.id;
    const keyhiveDocId = docIdFromAutomergeUrl(currentDocument.url);
    hasAccess =
      keyhiveKit!.keyhive.accessForDoc(id, keyhiveDocId) !== undefined;
  }

  // add comments to context
  const commentsContext = useSubcontext();

  const [currentDoc] = useDocument<DocWithComments>(currentDocument?.url);

  useEffect(() => {
    console.log("!! currentDoc changed", currentDoc);

    if (currentDocRef) {
      const storedThreads = getStoredThreads(
        currentDocRef.docHandle as DocHandle<DocWithComments>
      );

      console.log(
        "!! storedThreads",
        storedThreads[0]?.get(ThreadField)?.value?.comments[0]
      );

      commentsContext.replace(storedThreads as RefWith<ThreadField>[]);
    }
  }, [currentDoc, currentDocRef, commentsContext]);

  console.log("!! has access", hasAccess, currentDocument?.url);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No access
      </div>
    );
  }

  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No document open
      </div>
    );
  }

  const currentDocumentId = parseAutomergeUrl(currentDocument.url).documentId;
  const currentDocUrl = viewHeads
    ? stringifyAutomergeUrl({
        documentId: currentDocumentId,
        heads: encodeHeads(viewHeads.afterHeads),
      })
    : currentDocument.url;

  return (
    <div
      className={`w-full h-full ${viewHeads ? "border border-gray-500 border-dashed" : "border border-gray-200"}`}
    >
      {/* @ts-expect-error patchwork-view is a custom element */}
      <patchwork-view
        doc-url={currentDocUrl}
        tool-id={currentDocument.type}
        key={currentDocUrl}
      />
    </div>
  );
};

export const renderSingleView = toolify(SingleView);
