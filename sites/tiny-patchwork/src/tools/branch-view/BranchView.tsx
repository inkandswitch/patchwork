import * as Automerge from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";
import {
  useDocHandle,
  useDocument,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import { useDocRef, useSubcontext } from "@patchwork/context/react";
import { IsSelected } from "@patchwork/context/selection";
import { startTransition, useEffect, useState } from "react";
import { OpenDocumentEvent } from "../../lib/navigation";
import { toolify } from "../../lib/toolify";
import { BranchViewDoc, Branch } from "./datatype";

type BranchesDoc = {
  branches: Branch[];
};

type DocWithBranchesMetadata = {
  branchesDocUrl?: AutomergeUrl;
};

const BranchView = ({
  docUrl,
  element,
}: {
  docUrl: AutomergeUrl;
  element: HTMLElement | ShadowRoot;
}) => {
  const repo = useRepo();
  const [branchViewDoc, changeBranchViewDoc] = useDocument<BranchViewDoc>(
    docUrl,
    {
      suspense: true,
    }
  );

  const selectionContext = useSubcontext("BRANCH_VIEW");
  const [highlightChanges, setHighlightChanges] = useState(true);

  // The main document URL (could be undefined if nothing is open)
  const mainDocUrl = branchViewDoc.currentDocument?.url;

  // The currently checked out doc URL (either a branch or the main doc)
  const checkedOutDocUrl = branchViewDoc.selectedBranchDocUrl ?? mainDocUrl;

  // Get the current document reference for context
  const currentDocRef = useDocRef(checkedOutDocUrl);

  // Update selection context when current document changes
  useEffect(() => {
    console.log("!! set currentDocRef in branch view", currentDocRef);
    selectionContext.replace(
      currentDocRef ? [currentDocRef.with(IsSelected(true))] : []
    );
  }, [currentDocRef, selectionContext]);

  // Listen for open document events
  useEffect(() => {
    if (element) {
      const handleOpenDocument = (event: Event) => {
        const { docLink } = event as OpenDocumentEvent;
        console.log("branch view: handle open document event", event);

        changeBranchViewDoc((doc) => {
          // If it's a different document, switch to it and reset to main branch
          if (doc.currentDocument?.url !== docLink.url) {
            doc.currentDocument = docLink;
            doc.selectedBranchDocUrl = undefined; // Reset to main branch
          }
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
  }, [changeBranchViewDoc, element]);

  // Get the main document and its branch metadata
  const [mainDoc, changeMainDoc] =
    useDocument<DocWithBranchesMetadata>(mainDocUrl);
  const [checkedOutDoc] = useDocument(checkedOutDocUrl);

  // Create branches doc if it doesn't exist on the main document
  const shouldAddBranchesDocUrl =
    mainDoc && mainDoc.branchesDocUrl === undefined;

  useEffect(() => {
    if (shouldAddBranchesDocUrl) {
      changeMainDoc((doc) => {
        const handle = repo.create<BranchesDoc>();
        handle.change((doc) => {
          doc.branches = [];
        });
        doc.branchesDocUrl = handle.url;
      });
    }
  }, [shouldAddBranchesDocUrl, mainDocUrl, repo, changeMainDoc]);

  const [branchesDoc, changeBranchesDoc] = useDocument<BranchesDoc>(
    mainDoc?.branchesDocUrl
  );

  const checkedOutDocHandle = useDocHandle(checkedOutDocUrl);

  const createBranch = () => {
    if (!mainDoc || !checkedOutDocHandle) {
      return;
    }

    const branchDocHandle = repo.clone(checkedOutDocHandle);

    changeBranchesDoc((branchesDoc) => {
      const branch: Branch = {
        name: "Branch #" + (branchesDoc.branches.length + 1),
        forkedAt: Automerge.getHeads(checkedOutDoc || mainDoc),
        docUrl: branchDocHandle.url,
      };

      branchesDoc.branches.push(branch);

      // Update the branch view doc to select this new branch
      changeBranchViewDoc((doc) => {
        doc.selectedBranchDocUrl = branch.docUrl;
      });
    });
  };

  const handleBranchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    startTransition(() => {
      changeBranchViewDoc((doc) => {
        if (event.target.value === mainDocUrl) {
          doc.selectedBranchDocUrl = undefined; // Main branch
        } else {
          doc.selectedBranchDocUrl = event.target.value as AutomergeUrl;
        }
      });
    });
  };

  if (!branchViewDoc.currentDocument) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No document open
      </div>
    );
  }

  if (!branchesDoc) {
    return <div>Loading...</div>;
  }

  const isOnBranch = branchViewDoc.selectedBranchDocUrl !== undefined;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-row gap-2 p-2 border-b border-gray-200">
        <select
          value={checkedOutDocUrl}
          onChange={handleBranchChange}
          className="w-[200px] border border-gray-300 rounded-md p-2"
        >
          <option value={mainDocUrl}>Main</option>
          {branchesDoc?.branches.map((branch) => (
            <option value={branch.docUrl} key={branch.docUrl}>
              {branch.name}
            </option>
          ))}
        </select>

        <button
          onClick={createBranch}
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Create Branch
        </button>

        <div className="flex-1" />

        {isOnBranch && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={highlightChanges}
              onChange={() => setHighlightChanges(!highlightChanges)}
            />
            Highlight changes
          </label>
        )}
      </div>
      <div className="flex-1">
        {checkedOutDocUrl && (
          // @ts-expect-error patchwork-view is a custom element
          <patchwork-view
            doc-url={checkedOutDocUrl}
            tool-id={branchViewDoc.currentDocument.type}
            key={checkedOutDocUrl}
          />
        )}
      </div>
    </div>
  );
};

export const renderBranchView = toolify(BranchView);
