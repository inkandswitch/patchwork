import { asyncComputedPromise } from "@/async-signals";
import { dataTypeById } from "@/datatypes";
import { useDataTypes } from "@/hooks/useDataTypes";
import { useTools } from "@/hooks/useTools";
import { FolderDoc } from "@/packages/folder";
import { DocPath } from "@/packages/folder/datatype";
import { Button } from "@/shadcn/ui/button";
import { Toaster } from "@/shadcn/ui/toaster";
import { toolById, toolsForDataType } from "@/tools";
import { VersionControlEditor } from "@/versionControl/components/VersionControlEditor";
import { HasVersionControlMetadata } from "@/versionControl/schema";
import {
  fetchBranchScopeAndActiveBranchInfo,
  fetchOmOnActiveBranch,
} from "@/versionControl/signals";
import * as Automerge from "@automerge/automerge";
import {
  useDocument,
  useHandle,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import React, { useCallback, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  useCurrentAccount,
  useCurrentAccountDoc,
  useRootFolderDocWithMetadata,
} from "../account";
import { useRouter } from "../router";
import { useSyncDocTitle } from "../hooks/useSyncDocTitle";
import { useUIStateOm } from "../uiState";
import { ErrorFallback } from "./ErrorFallback";
import { LoadingScreen } from "./LoadingScreen";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export const Explorer: React.FC = () => {
  const repo = useRepo();
  const [accountDoc] = useCurrentAccountDoc();

  const rootFolderData = useRootFolderDocWithMetadata();
  const rootFolderDoc = rootFolderData?.doc;
  const rootFolderUrl = rootFolderData?.rootFolderUrl;
  const flatDocPaths = rootFolderData?.flatDocPaths;

  const [showSidebar, setShowSidebar] = useState(true);

  const { selectedDocPath, selectDocPath } = useRouter({
    rootFolderDocWithMetadata: rootFolderData,
  });
  const selectedDocLink = selectedDocPath && DocPath.toLink(selectedDocPath);

  const selectedDocUrl = selectedDocLink?.url;
  const selectedDocHandle =
    useHandle<HasVersionControlMetadata<unknown, unknown>>(selectedDocUrl);
  const [selectedDoc] =
    useDocument<HasVersionControlMetadata<unknown, unknown>>(selectedDocUrl);

  useEffect(() => {
    // @ts-expect-error global window
    window.handle = selectedDocHandle;
  }, [selectedDocHandle]);

  const selectedDocName = selectedDocLink?.name;
  const selectedDataTypeId = selectedDocLink?.type;

  const dataTypes = useDataTypes();
  const allTools = useTools();

  const selectedDataType = dataTypeById(dataTypes, selectedDataTypeId);
  const tools = toolsForDataType(allTools, selectedDataType);
  const [selectedToolId, setSelectedToolId] = useState<string>();
  const selectedTool = toolById(allTools, selectedToolId);

  const currentTool =
    // make sure the current tool is reset to the fallback tool
    // if the selected datatype changes and the selected tool is not compatible
    selectedTool &&
    selectedDataType &&
    (selectedTool.supportedDataTypes === "*" ||
      selectedTool.supportedDataTypes.some(
        (supportedDataType) => supportedDataType === selectedDataType?.id
      ))
      ? selectedTool
      : tools[0];

  const uiStateOm = useUIStateOm();
  const account = useCurrentAccount();

  const [docHeadsFromTimelineSidebar, setDocHeadsFromTimelineSidebar] =
    useState<Automerge.Heads>();

  const addNewDocument = useCallback(
    async ({
      type,
      change,
    }: {
      type: string;
      change?: (doc: unknown) => void;
    }) => {
      if (!uiStateOm) {
        throw new Error("uiStateHandle not ready");
      }

      const dataType = dataTypeById(dataTypes, type);

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

      if (!selectedDocPath) {
        // If nothing is selected, add the new document to the root folder
        // TODO: very weird code here
        if (!rootFolderUrl) {
          throw new Error("Root folder URL not ready");
        }
        parentFolderDocPath = DocPath.forRoot(rootFolderUrl);
      } else if (selectedDataTypeId === "folder") {
        // If a folder is currently selected, add the new document to that folder
        parentFolderDocPath = selectedDocPath;
      } else {
        // Otherwise, add the new document to the parent folder of the selected doc
        parentFolderDocPath = DocPath.parent(selectedDocPath);
      }

      const branchScopeAndActiveBranchInfoOfParentFolder =
        await asyncComputedPromise(() =>
          fetchBranchScopeAndActiveBranchInfo<FolderDoc>(
            parentFolderDocPath,
            account,
            repo
          )
        );

      const { activeBranchOm } = branchScopeAndActiveBranchInfoOfParentFolder;

      // If we are on a branch add an entry to the clone map that maps
      // the newly create document to itself
      if (activeBranchOm) {
        activeBranchOm.handle.change((branchDoc) => {
          branchDoc.clones[newDocHandle.url] = {
            url: newDocHandle.url,
            baseHeads: [],
          };
        });
      }

      const newDocLink = {
        url: newDocHandle.url,
        type,
        name: "Untitled document",
      };

      branchScopeAndActiveBranchInfoOfParentFolder.cloneOrMainOm.handle.change(
        (folderDoc) => {
          folderDoc.docs.unshift(newDocLink);
        }
      );

      selectDocPath([...parentFolderDocPath, newDocLink]);
    },
    [
      uiStateOm,
      dataTypes,
      repo,
      selectedDocPath,
      selectedDataTypeId,
      selectDocPath,
      rootFolderUrl,
      account,
    ]
  );

  // TODO: this only reads the main branch
  useSyncDocTitle({ selectedDocPath, selectDocPath, repo });

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

  const removeDocPath = async (docPath: DocPath) => {
    const docLink = DocPath.toLink(docPath);
    const parentFolderDocPath = DocPath.parent(docPath);
    const parentFolderOm = await asyncComputedPromise(() =>
      fetchOmOnActiveBranch<FolderDoc>(parentFolderDocPath, account, repo)
    );
    const parentFolderDoc = parentFolderOm.doc;
    const itemIndex = parentFolderDoc.docs.findIndex(
      (item) => item.url === docLink.url
    );
    if (itemIndex >= 0) {
      if (itemIndex < parentFolderDoc.docs.length - 1) {
        selectDocPath([
          ...parentFolderDocPath,
          parentFolderDoc.docs[itemIndex + 1],
        ]);
      } else if (itemIndex > 1) {
        selectDocPath([
          ...parentFolderDocPath,
          parentFolderDoc.docs[itemIndex - 1],
        ]);
      } else {
        selectDocPath(undefined);
      }

      // Wait for the URL to update before we delete the doc link;
      // otherwise we end up re-adding it via the existing URL
      setTimeout(() => {
        parentFolderOm.handle.change((doc) => {
          doc.docs.splice(itemIndex, 1);
        });
      }, 0);
    }
  };

  if (!accountDoc) {
    return <LoadingScreen what="account" />;
  }

  if (!rootFolderDoc) {
    return <LoadingScreen what="your documents" />;
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
            selectedDocPath={selectedDocPath}
            selectDocPath={selectDocPath}
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
              selectDocPath={selectDocPath}
              selectedDocPath={selectedDocPath}
              selectedDoc={selectedDoc}
              selectedDocHandle={selectedDocHandle}
              removeDocPath={removeDocPath}
              addNewDocument={addNewDocument}
              setToolId={setSelectedToolId}
              tool={currentTool}
              tools={tools}
              docHeadsFromTimelineSidebar={docHeadsFromTimelineSidebar}
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
                      No tools available for datatype: {selectedDataTypeId}
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE: we set the URL as the component key, to force re-mount on URL change.
                If we want more continuity we could not do this. */}
              {selectedDocUrl &&
                selectedDocPath &&
                currentTool &&
                flatDocPaths && (
                  <VersionControlEditor
                    key={DocPath.toString(selectedDocPath)}
                    docPath={selectedDocPath}
                    tool={currentTool}
                    addNewDocument={addNewDocument}
                    flatDocPaths={flatDocPaths}
                    docHeadsFromTimelineSidebar={docHeadsFromTimelineSidebar}
                    setDocHeadsFromTimelineSidebar={
                      setDocHeadsFromTimelineSidebar
                    }
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
