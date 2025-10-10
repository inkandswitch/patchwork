import { docIdFromAutomergeUrl } from "@automerge/automerge-keyhive-network-adapter";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { useDocRef, useSubcontext } from "@patchwork/context/react";
import { IsSelected } from "@patchwork/context/selection";
import { KeyhiveKit } from "@patchwork/identity";
import { useEffect } from "react";
import { OpenDocumentEvent } from "../../lib/navigation";
import { toolify } from "../../lib/toolify";
import { SingleViewDoc } from "./datatype";

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

  // Get the current document reference for context
  const currentDocRef = useDocRef(singleViewDoc.currentDocument?.url);

  // Update selection context when current document changes
  useEffect(() => {
    console.log("!! set currentDocRef in single view", currentDocRef);
    selectionContext.replace(
      currentDocRef ? [currentDocRef.with(IsSelected(true))] : []
    );
  }, [currentDocRef, selectionContext]);

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

  let hasAccess = false;
  const currentDocument = singleViewDoc.currentDocument;

  if (currentDocument) {
    const id = keyhiveKit!.active.individual.id;
    const keyhiveDocId = docIdFromAutomergeUrl(
      singleViewDoc.currentDocument.url
    );
    hasAccess =
      keyhiveKit!.keyhive.accessForDoc(id, keyhiveDocId) !== undefined;
  }

  console.log("!! has access", hasAccess, currentDocument?.url);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No access
      </div>
    );
  }

  if (!singleViewDoc.currentDocument) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No document open
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* @ts-expect-error patchwork-view is a custom element */}
      <patchwork-view
        doc-url={singleViewDoc.currentDocument.url}
        tool-id={singleViewDoc.currentDocument.type}
        key={singleViewDoc.currentDocument.url}
      />
    </div>
  );
};

export const renderSingleView = toolify(SingleView);
