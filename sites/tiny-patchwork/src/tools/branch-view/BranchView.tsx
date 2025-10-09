import * as Automerge from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";
import {
  useDocHandle,
  useDocument,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import { useDocRef, useSubcontext } from "@patchwork/context/react";
import { IsSelected } from "@patchwork/context/selection";
import { startTransition, useEffect, useMemo, useState } from "react";
import { OpenDocumentEvent } from "../../lib/navigation";
import { toolify } from "../../lib/toolify";
import { BranchViewDoc, Branch } from "./datatype";
import { PathRef, RefWith } from "@patchwork/context";
import { Diff, getDiffOfDoc } from "@patchwork/context/diff";

type VersionControl = {
  branches: Branch[];
};

type DocWithVersionControl = {
  "@version-control"?: VersionControl;
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
  const diffContext = useSubcontext("BRANCH_VIEW_DIFF");
  const [highlightChanges, setHighlightChanges] = useState(true);

  // The main document URL (could be undefined if nothing is open)
  const mainDocUrl = branchViewDoc.currentDocument?.url;

  // The currently checked out doc URL (either a branch or the main doc)
  const checkedOutDocUrl = branchViewDoc.selectedBranchDocUrl ?? mainDocUrl;

  // Get the main document reference for selection context
  // Note: We always use the main document for selection, not the branch
  const mainDocRef = useDocRef(mainDocUrl);

  // Update selection context when main document changes
  // Always select the main document, even when viewing a branch
  useEffect(() => {
    console.log("!! set mainDocRef in branch view", mainDocRef);
    selectionContext.replace(
      mainDocRef ? [mainDocRef.with(IsSelected(true))] : []
    );
  }, [mainDocRef, selectionContext]);

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
            delete doc.selectedBranchDocUrl; // Reset to main branch
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

  // Get the main document and its version control metadata
  const [mainDoc, changeMainDoc] =
    useDocument<DocWithVersionControl>(mainDocUrl);

  // Initialize version control if it doesn't exist on the main document
  useEffect(() => {
    if (mainDoc && !mainDoc["@version-control"]) {
      changeMainDoc((doc) => {
        doc["@version-control"] = {
          branches: [],
        };
      });
    }
  }, [mainDoc, changeMainDoc]);

  const checkedOutDocHandle = useDocHandle(checkedOutDocUrl);
  const [checkedOutDoc] = useDocument(checkedOutDocUrl);

  const isOnBranch = branchViewDoc.selectedBranchDocUrl !== undefined;
  const branches = mainDoc?.["@version-control"]?.branches || [];

  // Compute diffs when on a branch with highlight changes enabled
  const diffsOfDoc = useMemo<RefWith<Diff>[]>(() => {
    // make eslint happy, we need checkedOutDoc as a dependency because we need
    // to re-run the diff when the checked out doc changes
    void checkedOutDoc;

    if (!isOnBranch || !highlightChanges) {
      return [];
    }

    const currentBranch = branches.find(
      (b) => b.docUrl === branchViewDoc.selectedBranchDocUrl
    );

    if (!currentBranch) {
      return [];
    }

    return getDiffOfDoc(
      checkedOutDocHandle,
      highlightChanges ? currentBranch.forkedAt : undefined
    );
  }, [
    checkedOutDocHandle,
    highlightChanges,
    isOnBranch,
    branchViewDoc.selectedBranchDocUrl,
    branches,
    checkedOutDoc,
  ]);

  // Update diff context
  useEffect(() => {
    console.log("Branch View: computed diffs", {
      diffsOfDoc,
      count: diffsOfDoc.length,
      isOnBranch,
      highlightChanges,
      checkedOutDocUrl,
      currentBranch: branches.find(
        (b) => b.docUrl === branchViewDoc.selectedBranchDocUrl
      ),
    });
    diffContext.replace(diffsOfDoc);
  }, [
    diffContext,
    diffsOfDoc,
    isOnBranch,
    highlightChanges,
    checkedOutDocUrl,
    branches,
    branchViewDoc.selectedBranchDocUrl,
  ]);

  const createBranch = () => {
    // Close the dropdown by blurring the active element
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (!mainDoc || !checkedOutDocHandle) {
      return;
    }

    const branchDocHandle = repo.clone(checkedOutDocHandle);

    changeMainDoc((doc) => {
      if (!doc["@version-control"]) {
        doc["@version-control"] = { branches: [] };
      }

      const branch: Branch = {
        name: "Branch #" + (doc["@version-control"].branches.length + 1),
        forkedAt: Automerge.getHeads(checkedOutDoc || mainDoc),
        docUrl: branchDocHandle.url,
        merged: false,
      };

      doc["@version-control"].branches.push(branch);

      // Update the branch view doc to select this new branch
      changeBranchViewDoc((viewDoc) => {
        viewDoc.selectedBranchDocUrl = branch.docUrl;
      });
    });
  };

  const mergeBranch = async () => {
    if (!mainDoc || !isOnBranch || !branchViewDoc.selectedBranchDocUrl) {
      return;
    }

    const currentBranch = branches.find(
      (b) => b.docUrl === branchViewDoc.selectedBranchDocUrl
    );

    if (!currentBranch) {
      return;
    }

    const branchHandle = await repo.find<any>(currentBranch.docUrl);
    const mainHandle = await repo.find<any>(mainDocUrl!);

    // Merge the branch into main
    mainHandle.merge(branchHandle);

    // Mark the branch as merged
    changeMainDoc((doc) => {
      if (!doc["@version-control"]) return;

      const branch = doc["@version-control"].branches.find(
        (b) => b.docUrl === currentBranch.docUrl
      );
      if (branch) {
        branch.merged = true;
      }
    });

    // Switch back to main
    changeBranchViewDoc((doc) => {
      delete doc.selectedBranchDocUrl;
    });

    console.log("Merged branch:", currentBranch.name);
  };

  const handleBranchSelect = (branchDocUrl: AutomergeUrl | undefined) => {
    // Close the dropdown by blurring the active element
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    startTransition(() => {
      changeBranchViewDoc((doc) => {
        if (branchDocUrl === undefined) {
          delete doc.selectedBranchDocUrl; // Main branch
        } else {
          doc.selectedBranchDocUrl = branchDocUrl;
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

  if (!mainDoc?.["@version-control"]) {
    return <div>Loading...</div>;
  }

  // Filter out merged branches
  const activeBranches = branches.filter((b) => !b.merged);

  // Get the current branch name for display
  const currentBranch = branches.find(
    (b) => b.docUrl === branchViewDoc.selectedBranchDocUrl
  );
  const currentBranchName = currentBranch?.name || "Main";

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-row gap-2 p-2 border-b border-base-300 bg-base-100">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-sm btn-ghost">
            {currentBranchName}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg border border-base-300"
          >
            <li>
              <a onClick={() => handleBranchSelect(undefined)}>Main</a>
            </li>
            {activeBranches.map((branch) => (
              <li key={branch.docUrl}>
                <a onClick={() => handleBranchSelect(branch.docUrl)}>
                  {branch.name}
                </a>
              </li>
            ))}
            <li className="border-t border-base-300 mt-1 pt-1">
              <a onClick={createBranch}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Create Branch
              </a>
            </li>
          </ul>
        </div>

        {isOnBranch && (
          <button onClick={mergeBranch} className="btn btn-sm btn-ghost">
            Merge Branch
          </button>
        )}

        <div className="flex-1" />

        {isOnBranch && (
          <label className="label cursor-pointer gap-2">
            <span className="label-text">Highlight changes</span>
            <input
              type="checkbox"
              checked={highlightChanges}
              onChange={() => setHighlightChanges(!highlightChanges)}
              className="checkbox checkbox-sm"
            />
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
