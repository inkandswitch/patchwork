import { Button } from "@/shadcn/ui/button";
import {
  useDocument,
  useHandle,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  useCurrentAccount,
  useCurrentAccountDoc,
  useRootFolderDocWithChildren,
  useUIStateHandle,
} from "../account";

import { Toaster } from "@/shadcn/ui/sonner";
import { LoadingScreen } from "./LoadingScreen";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

import {
  VersionControlEditor,
  fakeDocPath,
} from "@/versionControl/components/VersionControlEditor";
import {
  HasVersionControlMetadata,
  LegacyBranch,
} from "@/versionControl/schema";

import { Om } from "@/om";
import { DocLinkWithFolderPath, FolderDoc } from "@/packages/folder";
import { DocPath } from "@/packages/folder/datatype";
import { loadedValue } from "@/signals";
import { branchScopeAndActiveBranchInfo } from "@/versionControl/signals";
import _ from "lodash";
import { useDataType, useDataTypes } from "../../datatypes";
import { useTool, useToolsForDataType } from "../../tools";
import { useSelectedDocLink } from "../hooks/useSelectedDocLink";
import { ErrorFallback } from "./ErrorFallback";
import { useSyncDocTitle } from "../hooks/useSyncDocTitle";

export const Explorer: React.FC = () => {
  const repo = useRepo();
  const dataTypes = useDataTypes();
  const currentAccount = useCurrentAccount();
  const [accountDoc] = useCurrentAccountDoc();

  const rootFolderData = useRootFolderDocWithChildren();
  const { doc: rootFolderDoc, rootFolderUrl, flatDocLinks } = rootFolderData;

  const [showSidebar, setShowSidebar] = useState(true);

  const { selectedDocLink, selectDocLink } = useSelectedDocLink({
    folderDocWithMetadata: rootFolderData,
    repo,
  });

  const getFakeDocPathForDocUrl = useCallback(
    (url: string) => {
      const docLinkWithFolderPath = flatDocLinks.find(
        (link) => link.url === url
      );
      if (!docLinkWithFolderPath) {
        throw new Error(`getFakeDocPathForDocUrl: No doc found for url: ${url}`);
      }
      return fakeDocPath(docLinkWithFolderPath);
    },
    [flatDocLinks]
  );

  const selectedDocUrl = selectedDocLink?.url;
  const selectedDocHandle =
    useHandle<HasVersionControlMetadata<unknown, unknown>>(selectedDocUrl);
  const [selectedDoc] =
    useDocument<HasVersionControlMetadata<unknown, unknown>>(selectedDocUrl);

  const selectedDocName = selectedDocLink?.name;
  const selectedDataTypeId = selectedDocLink?.type;
  const selectedBranchUrl = selectedDocLink?.branchUrl;

  const selectedBranch = useMemo<LegacyBranch | undefined>(() => {
    if (!selectedBranchUrl || !selectedDoc) {
      return;
    }

    return selectedDoc.branchMetadata.branches.find(
      (b) => b.url === selectedBranchUrl
    );
  }, [selectedBranchUrl, selectedDoc]);

  const selectedDataType = useDataType(selectedDataTypeId);
  const tools = useToolsForDataType(selectedDataType);
  const [selectedToolId, setSelectedToolId] = useState<string>();
  const toolModules = useToolsForDataType(selectedDataType);
  const selectedTool = useTool(selectedToolId);

  const currentTool =
    // make sure the current tool is reset to the fallback tool
    // if the selected datatype changes and the selected tool is not compatible
    selectedTool && selectedDataType &&
    (selectedTool.supportedDataTypes === "*" ||
      selectedTool.supportedDataTypes.some(
        (supportedDataType) => supportedDataType === selectedDataType?.id
      ))
      ? selectedTool
      : toolModules[0];

  const uiStateHandle = useUIStateHandle();

  const addNewDocument = useCallback(
    async ({
      type,
      change,
    }: {
      type: string;
      change?: (doc: unknown) => void;
    }) => {
      if (!uiStateHandle) {
        throw new Error("uiStateHandle not ready");
      }

      const dataType = dataTypes.find(({ id }) => id === type);

      if (!dataType) {
        throw new Error(`Unsupported document type: ${type}`);
      }

      const newDocHandle =
        repo.create<HasVersionControlMetadata<unknown, unknown>>();
      newDocHandle.change((doc) => {
        dataType.init(doc, repo);

        if (change) {
          change(doc);
        }
      });

      let parentFolderDocPath: DocPath;

      if (!selectedDocLink) {
        // If nothing is selected, add the new document to the root folder
        // TODO: very weird code here
        parentFolderDocPath = fakeDocPath({url: rootFolderUrl, name: 'root', type: 'folder', folderPath: []});
      } else if (selectedDocLink.type === "folder") {
        // If a folder is currently selected, add the new document to that folder
        parentFolderDocPath = fakeDocPath(selectedDocLink);
      } else {
        // Otherwise, add the new document to the parent folder of the selected doc
        parentFolderDocPath = _.initial(fakeDocPath(selectedDocLink));
      }

      const { cloneOrMainOm } = await loadedValue(() =>
        branchScopeAndActiveBranchInfo(parentFolderDocPath, uiStateHandle, repo)
      );
      const parentFolderBranchedOm = cloneOrMainOm as Om<FolderDoc>;

      const newDocLink = {
        url: newDocHandle.url,
        type,
        name: "Untitled document",
      };

      parentFolderBranchedOm.handle.change((folderDoc) => {
        folderDoc.docs.unshift(newDocLink);
      });

      selectDocLink({
        ...newDocLink,
        folderPath: parentFolderDocPath.map((link) => link.url),
      });
    },
    [dataTypes, repo, selectedDocLink, uiStateHandle, selectDocLink, rootFolderUrl]
  );

  // TODO: this only reads the main branch
  useSyncDocTitle({
    selectedDocLink,
    selectedDoc,
    selectDocLink,
    repo,
  });

  // update tab title to be the selected doc
  useEffect(() => {
    document.title = selectedDocName ?? "Essay Editor"; // TODO: generalize beyond TEE
  }, [selectedDocName]);

  // keyboard shortcuts
  useEffect(() => {
    const keydownHandler = (event: KeyboardEvent) => {
      // toggle the sidebar open/closed when the user types cmd-backslash
      if (event.key === "\\" && event.metaKey) {
        setShowSidebar((prev) => !prev);
      }

      // if there's no document selected and the user hits enter, make a new document
      if (!selectedDocUrl && event.key === "Enter") {
        addNewDocument({ type: "essay" });
      }
    };

    window.addEventListener("keydown", keydownHandler);

    // Clean up listener on unmount
    return () => {
      window.removeEventListener("keydown", keydownHandler);
    };
  }, [addNewDocument, selectedDocUrl]);

  const removeDocLink = async (link: DocLinkWithFolderPath) => {
    const folderHandle = repo.find<FolderDoc>(
      link.folderPath[link.folderPath.length - 1]
    );
    const folderDoc = await folderHandle.doc();
    if (!folderDoc) {
      throw new Error("Folder doc missing");
    }
    const itemIndex = folderDoc
      .docs.findIndex((item) => item.url === link.url);
    if (itemIndex >= 0) {
      if (itemIndex < folderDoc.docs.length - 1) {
        selectDocLink({
          ...folderDoc.docs[itemIndex + 1],
          folderPath: link.folderPath,
        });
      } else if (itemIndex > 1) {
        selectDocLink({
          ...folderDoc.docs[itemIndex - 1],
          folderPath: link.folderPath,
        });
      } else {
        selectDocLink(undefined);
      }

      // Wait for the URL to update before we delete the doc link;
      // otherwise we end up re-adding it via the existing URL
      setTimeout(() => {
        folderHandle.change((doc) => {
          doc.docs.splice(itemIndex, 1);
        });
      }, 0);
    }
  };

  if (!accountDoc || !rootFolderDoc) {
    return (
      <LoadingScreen
        docUrl={currentAccount?.handle?.url}
        handle={currentAccount?.handle}
      />
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="flex flex-row w-screen h-screen overflow-hidden">
        <div
          className={`${
            showSidebar ? "w-64" : "w-0 translate-x-[-100%]"
          } flex-shrink-0 bg-gray-100 border-r border-gray-400 transition-all duration-100 overflow-hidden  `}
        >
          <Sidebar
            rootFolderDoc={rootFolderData}
            selectedDocLink={selectedDocLink}
            selectDocLink={selectDocLink}
            hideSidebar={() => setShowSidebar(false)}
            addNewDocument={addNewDocument}
          />
        </div>
        <div
          className={`flex-grow relative h-screen overflow-hidden ${
            !selectedDocUrl ? "bg-gray-200" : ""
          }`}
        >
          <div className="flex flex-col h-screen">
            <Topbar
              showSidebar={showSidebar}
              setShowSidebar={setShowSidebar}
              selectDocLink={selectDocLink}
              selectedDocLink={selectedDocLink}
              selectedDoc={selectedDoc}
              selectedDocHandle={selectedDocHandle}
              removeDocLink={removeDocLink}
              addNewDocument={addNewDocument}
              setToolId={setSelectedToolId}
              tool={currentTool}
              tools={tools}
            />
            <div className="flex-grow overflow-hidden z-0">
              {!selectedDocUrl && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div>
                    <p className="text-center cursor-default select-none mb-4">
                      No document selected
                    </p>
                    <Button
                      onClick={() => addNewDocument({ type: "essay" })} // Default type for new document
                      variant="outline"
                    >
                      Create new document
                      <span className="ml-2">(&#9166;)</span>
                    </Button>
                  </div>
                </div>
              )}

              {selectedDocUrl && selectedDoc && tools.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-sm">
                      No tools available for datatype: {selectedDocLink?.type}
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE: we set the URL as the component key, to force re-mount on URL change.
                If we want more continuity we could not do this. */}
              {selectedDocUrl && selectedDoc && currentTool && (
                <VersionControlEditor
                  selectedDocLink={selectedDocLink}
                  datatypeId={selectedDocLink?.type}
                  docUrl={selectedDocUrl}
                  key={selectedDocUrl}
                  tool={currentTool}
                  addNewDocument={addNewDocument}
                  flatDocLinks={flatDocLinks}
                  getFakeDocPathForDocUrl={getFakeDocPathForDocUrl}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <Toaster />
    </ErrorBoundary>
  );
};
