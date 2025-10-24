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
import { RefWith } from "@patchwork/context";
import {
  DocWithComments,
  getStoredThreads,
  ThreadField,
} from "@patchwork/context/comments";
import { computeDiffOfDoc, Diff, getViewHeads } from "@patchwork/context/diff";
import {
  useDocRef,
  useReactive,
  useSubcontext,
} from "@patchwork/context/react";
import { IsSelected } from "@patchwork/context/selection";
import { HasPatchworkMetadata } from "@patchwork/filesystem";
import { ToolElement } from "@patchwork/plugins";
import { useEffect, useMemo, useState } from "react";
import { useTitle } from "../../lib/datatype-hooks";
import { openDocument, OpenDocumentEvent } from "../../lib/navigation";
import { toolify } from "../../lib/toolify";
import { SingleViewDoc } from "./datatype";

const SingleView = ({
  docUrl,
  element,
}: {
  docUrl: AutomergeUrl;
  element: ToolElement;
}) => {
  const [singleViewDoc, changeSingleViewDoc] = useDocument<SingleViewDoc>(
    docUrl,
    { suspense: true }
  );

  const { highlightChanges } = singleViewDoc;

  const [selection, setSelection] = useState<
    { url: AutomergeUrl; toolId?: string } | undefined
  >(undefined);

  const currentDocRef = useDocRef(selection?.url);

  const viewHeads = useReactive(
    useMemo(
      () => (currentDocRef ? getViewHeads(currentDocRef) : undefined),
      [currentDocRef]
    )
  );

  const afterHeads = viewHeads?.afterHeads;

  const selectedDocUrl = useMemo(() => {
    if (!selection?.url) {
      return undefined;
    }

    if (!afterHeads) {
      return selection.url;
    }

    const currentDocumentId = parseAutomergeUrl(selection.url).documentId;
    return stringifyAutomergeUrl({
      documentId: currentDocumentId,
      heads: encodeHeads(afterHeads),
    });
  }, [selection?.url, afterHeads]);
  const selectedDocHandle = useDocHandle(selectedDocUrl);
  const [selectedDoc] = useDocument<DocWithComments & HasPatchworkMetadata>(
    selectedDocUrl
  );

  const originalDocUrl = selectedDoc?.["@patchwork"]?.copyOf;
  const [originalDoc] = useDocument<HasPatchworkMetadata>(originalDocUrl);

  const beforeHeads = useMemo(() => {
    if (viewHeads) {
      return viewHeads.beforeHeads;
    }

    if (highlightChanges && originalDocUrl) {
      return parseAutomergeUrl(originalDocUrl).hexHeads;
    }

    return undefined;
  }, [viewHeads, highlightChanges, originalDocUrl]);

  // mark the current document as selected
  const selectionContext = useSubcontext("SINGLE_VIEW_SELECTION");
  useEffect(() => {
    selectionContext.replace(
      currentDocRef ? [currentDocRef.with(IsSelected(true))] : []
    );
  }, [currentDocRef, selectionContext]);

  // Compute diffs when on a branch with highlight changes enabled
  const diffsOfDoc = useMemo<RefWith<Diff>[]>(() => {
    void selectedDoc;
    if (!selectedDocHandle || !beforeHeads) {
      return [];
    }

    return computeDiffOfDoc(selectedDocHandle, beforeHeads);
  }, [selectedDocHandle, beforeHeads, selectedDoc]);

  const diffContext = useSubcontext("SINGLE_VIEW_DIFFS");
  useEffect(() => {
    diffContext.replace(diffsOfDoc);
  }, [diffContext, diffsOfDoc]);

  // Listen for open document events
  useEffect(() => {
    if (element) {
      const handleOpenDocument = (event: OpenDocumentEvent) => {
        const { url, toolId } = event.detail;
        console.log("single view: handle open document event", event);

        setSelection({ url, toolId });
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
  }, [element, setSelection]);

  // add doc handle to window
  useEffect(() => {
    if (currentDocRef) {
      (window as any).currentDocHandle = currentDocRef.docHandle;
    }
  }, [currentDocRef]);

  const hasAccess = !element.hive;

  if (selectedDocUrl && element.hive) {
    //const id = element.hive.active.individual.id;
    //const keyhiveDocId = docIdFromAutomergeUrl(selectedDocUrl);
    //hasAccess =
    //      element.hive.keyhive.accessForDoc(id, keyhiveDocId) !== undefined;
  }

  const title = useTitle(selectedDoc as HasPatchworkMetadata);
  const titleOfOriginalDoc = useTitle(originalDoc);

  // add comments to context
  const commentsContext = useSubcontext("SINGLE_VIEW_COMMENTS");
  useEffect(() => {
    if (!selectedDoc || !selectedDocHandle) {
      return;
    }

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
    <div className="w-full h-full flex flex-col bg-gray-200">
      <div className="p-2 bg-gray-100 border-gray-200 border-l border-r flex items-center">
        <div className="flex items-center gap-2">
          {title}{" "}
          {originalDoc && originalDocUrl && (
            <div className="text-gray-500 text-sm">
              (Copy of{" "}
              <button
                className="link"
                onClick={() => {
                  openDocument(element, originalDocUrl);
                }}
              >
                {titleOfOriginalDoc}
              </button>
              )
            </div>
          )}
        </div>
        <div className="flex-1" />
        {originalDoc && !viewHeads && (
          <label className="label text-sm">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={highlightChanges}
              onChange={(e) => {
                changeSingleViewDoc((doc) => {
                  doc.highlightChanges = e.target.checked;
                });
              }}
            />
            Highlight changes
          </label>
        )}
      </div>
      <div
        className={`flex-1 ${viewHeads ? "border border-gray-500 border-dashed" : "border border-gray-200"}`}
      >
        <patchwork-view
          doc-url={selectedDocUrl}
          tool-id={selection?.toolId}
          key={selectedDocUrl}
        />
      </div>
    </div>
  );
};

export const renderSingleView = toolify(SingleView);
