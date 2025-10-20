//import { docIdFromAutomergeUrl } from "@automerge/automerge-repo-keyhive";
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
import { useEffect, useMemo } from "react";
import { openDocument, OpenDocumentEvent } from "../../lib/navigation";
import { toolify } from "../../lib/toolify";
import { SingleViewDoc } from "./datatype";
import { Diff, getDiffOfDoc, getViewHeads } from "@patchwork/context/diff";
import { RefWith } from "@patchwork/context";
import {
  DocWithComments,
  getStoredThreads,
  ThreadField,
} from "@patchwork/context/comments";
import { useTitle } from "../../lib/datatype-hooks";
import { HasPatchworkMetadata } from "@patchwork/filesystem";
import type { ToolElement } from "@patchwork/plugins";

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

  const { selection, highlightChanges } = singleViewDoc;

  const currentDocRef = useDocRef(selection?.url);

  const contextViewHeads = useReactive(getViewHeads(currentDocRef));

  const afterHeads = useMemo(() => {
    if (contextViewHeads) {
      return contextViewHeads.afterHeads;
    }

    return undefined;
  }, [contextViewHeads, highlightChanges, currentDocRef]);

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
    if (contextViewHeads) {
      return contextViewHeads.beforeHeads;
    }

    if (highlightChanges && originalDocUrl) {
      return parseAutomergeUrl(originalDocUrl).hexHeads;
    }

    return undefined;
  }, [contextViewHeads, highlightChanges, originalDocUrl]);

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
    void selectedDoc;
    if (!selectedDocHandle || !beforeHeads) {
      return [];
    }

    return getDiffOfDoc(selectedDocHandle, beforeHeads);
  }, [selectedDocHandle, beforeHeads, selectedDoc]);

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
        {originalDoc && !contextViewHeads && (
          <label className="label text-sm">
            <input
              type="checkbox"
              defaultChecked
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
        className={`flex-1 ${contextViewHeads ? "border border-gray-500 border-dashed" : "border border-gray-200"}`}
      >
        <patchwork-view doc-url={selectedDocUrl} key={selectedDocUrl} />
      </div>
    </div>
  );
};

export const renderSingleView = toolify(SingleView);
