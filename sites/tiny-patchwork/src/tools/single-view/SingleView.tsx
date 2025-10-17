import { docIdFromAutomergeUrl } from "@automerge/automerge-repo-keyhive";
import {
  AutomergeUrl,
  DocHandle,
  encodeHeads,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
} from "@automerge/automerge-repo";
import {
  useDocHandle,
  useDocument,
} from "@automerge/automerge-repo-react-hooks";
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
    { suspense: true }
  );

  const { selection } = singleViewDoc;

  const currentDocRef = useDocRef(selection?.url);

  const viewHeads = useReactive(getViewHeads(currentDocRef));
  const selectedDocUrl = useMemo(() => {
    if (!selection?.url) {
      return undefined;
    }

    if (!viewHeads) {
      return selection.url;
    }

    const currentDocumentId = parseAutomergeUrl(selection.url).documentId;
    return stringifyAutomergeUrl({
      documentId: currentDocumentId,
      heads: encodeHeads(viewHeads.afterHeads),
    });
  }, [selection?.url, viewHeads]);

  const selectedDocHandle = useDocHandle(selectedDocUrl);
  const [selectedDoc] = useDocument<DocWithComments>(selectedDocUrl);

  // mark the current document as selected

  const selectionContext = useSubcontext("SINGLE_VIEW");
  useEffect(() => {
    console.log("!! set currentDocRef in single view", currentDocRef);
    selectionContext.replace(
      currentDocRef ? [currentDocRef.with(IsSelected(true))] : []
    );
  }, [currentDocRef, selectionContext]);

  // Compute diffs when on a branch with highlight changes enabled
  const diffsOfDoc = useMemo<RefWith<Diff>[]>(() => {
    if (!selectedDocHandle || !viewHeads) {
      return [];
    }

    return getDiffOfDoc(selectedDocHandle, viewHeads.beforeHeads);
  }, [selectedDocHandle, viewHeads]);

  const diffContext = useSubcontext("SINGLE_VIEW_DIFF");
  useEffect(() => {
    diffContext.replace(diffsOfDoc);
  }, [diffContext, diffsOfDoc]);

  // Listen for open document events
  useEffect(() => {
    if (element) {
      const handleOpenDocument = (event: OpenDocumentEvent) => {
        const { url, toolId } = event.detail;
        console.log("single view: handle open document event", event);

        changeSingleViewDoc((doc) => {
          // Simply replace the current document
          doc.selection = { url, toolId: toolId ?? null };
        });
      };

      (element as HTMLElement).addEventListener(
        "patchwork:open-document",
        handleOpenDocument
      );
      return () => {
        (element as HTMLElement).removeEventListener(
          "patchwork:open-document",
          handleOpenDocument
        );
      };
    }
  }, [changeSingleViewDoc, element]);

  // add doc handle to window
  useEffect(() => {
    if (currentDocRef) {
      (window as any).currentDocHandle = currentDocRef.docHandle;
    }
  }, [currentDocRef]);

  let hasAccess = false;

  if (selectedDocUrl) {
    const id = keyhiveKit!.active.individual.id;
    const keyhiveDocId = docIdFromAutomergeUrl(selectedDocUrl);
    hasAccess =
      keyhiveKit!.keyhive.accessForDoc(id, keyhiveDocId) !== undefined;
  }

  // add comments to context
  const commentsContext = useSubcontext();
  useEffect(() => {
    void selectedDoc;

    if (selectedDocHandle) {
      const storedThreads = getStoredThreads(
        selectedDocHandle as DocHandle<DocWithComments>
      );

      commentsContext.replace(storedThreads as RefWith<ThreadField>[]);
    }
  }, [selectedDocHandle, commentsContext, selectedDoc]);

  if (!selectedDocUrl) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No document open
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No access
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full ${viewHeads ? "border border-gray-500 border-dashed" : "border border-gray-200"}`}
    >
      <patchwork-view doc-url={selectedDocUrl} key={selectedDocUrl} />
    </div>
  );
};

export const renderSingleView = toolify(SingleView);
