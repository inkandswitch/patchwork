import {
  DataType,
  DataTypeImplementation,
  Tool,
  ToolDescription,
  useSuggestedModuleForDocUrl,
} from "@patchwork/sdk";
import { useMatchingPluginDescriptions } from "@patchwork/sdk/hooks";
import { type DocPath, DocPathUtils } from "@patchwork/sdk/router";
import { Toaster } from "@patchwork/sdk/ui";
import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import * as Automerge from "@automerge/automerge";
import {
  useDocument,
  useRepo,
  useDocHandle,
} from "@automerge/automerge-repo-react-hooks";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  useCurrentAccount,
  useCurrentAccountDoc,
  useRootFolderDocWithMetadata,
} from "@patchwork/sdk";
import { useRouter } from "@patchwork/sdk/router";
import { useSyncDocTitle } from "../hooks/useSyncDocTitle";
import { useUIStateOm } from "@patchwork/sdk/router";
import { ErrorFallback, LoadingScreen } from "@patchwork/sdk/components";
import { Sidebar } from "./sidebar/Sidebar";
import { Topbar } from "./Topbar";
import { VersionControlEditor } from "../../versionControl/components";
import { usePlugin } from "@patchwork/sdk/hooks";
import { useModuleWatcher } from "../hooks/useModuleWatcher";
import { useSelectedTool } from "../hooks/useSelectedTool";
import { DocHandle } from "@automerge/automerge-repo";
import { addNewDocument } from "../docActions";
import { removeDocPath } from "../docActions";
import { NoDocumentSelected } from "./NoDocumentSelected";

// A hook that runs any needed data migrations when a doc is selected and fully loaded.
// We have to be careful to only run:
// - when the handle has changed
// - when the document data for the handle has become available
const useRunMigrationsOnceOnLoad = ({
  handle,
  dataType,
}: {
  handle: DocHandle<unknown> | undefined;
  dataType: DataTypeImplementation<any> | undefined;
}) => {
  const repo = useRepo();
  const hasRunForCurrentHandle = useRef<string | null>(null);
  const doc = handle?.doc();
  useEffect(() => {
    // Reset tracking when handle changes
    if (!handle || !dataType) {
      hasRunForCurrentHandle.current = null;
      return;
    }

    const handleId = handle.url;

    // Only run if we have a doc and haven't run for this handle yet
    if (doc && hasRunForCurrentHandle.current !== handleId) {
      (async () => {
        if (!dataType.migrations) return;
        for (const migration of dataType.migrations) {
          if (await migration.migrationNeedsToRun(handle, repo)) {
            console.log(
              `Running migration "${migration.description}" on document ${handle.url}`
            );
            await migration.runMigration(handle, repo);
          }
        }
      })();

      hasRunForCurrentHandle.current = handleId;
    }
  }, [handle, doc, dataType, repo]);
};

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
  const selectedDocLink =
    selectedDocPath && DocPathUtils.toLink(selectedDocPath);

  const selectedDocUrl = selectedDocLink?.url;
  const selectedDocHandle =
    useDocHandle<HasVersionControlMetadata<unknown, unknown>>(selectedDocUrl);
  const [selectedDoc] =
    useDocument<HasVersionControlMetadata<unknown, unknown>>(selectedDocUrl);

  const { watcher } = useModuleWatcher();
  useSuggestedModuleForDocUrl(selectedDocUrl, watcher);

  useEffect(() => {
    // @ts-expect-error global window
    window.handle = selectedDocHandle;
    // @ts-expect-error global window
    window.flatDocPaths = flatDocPaths;
  }, [selectedDocHandle, flatDocPaths]);

  const selectedDataTypeId = selectedDocLink?.type;
  const { plugin: selectedDataType } = usePlugin<DataType>(
    "patchwork:dataType",
    selectedDataTypeId
  );

  useRunMigrationsOnceOnLoad({
    handle: selectedDocHandle,
    dataType: selectedDataType,
  });

  const { currentTool, isLoadingTool, handleToolChange, toolDescriptions } =
    useSelectedTool(selectedDataTypeId, selectedDocUrl);

  const uiStateOm = useUIStateOm();
  const account = useCurrentAccount();

  const [docHeadsFromTimelineSidebar, setDocHeadsFromTimelineSidebar] =
    useState<Automerge.Heads>();

  const addNewDoc = useCallback(
    (args: { type: string; change?: (doc: unknown) => void }) =>
      addNewDocument({
        ...args,
        uiStateOm,
        repo,
        selectedDocPath,
        selectedDataTypeId,
        selectDocPath,
        rootFolderUrl,
        account,
      }),
    [
      uiStateOm,
      repo,
      selectedDocPath,
      selectedDataTypeId,
      selectDocPath,
      rootFolderUrl,
      account,
    ]
  );

  const removeDocPathCallback = useCallback(
    (docPath: DocPath) =>
      removeDocPath({
        docPath,
        account,
        repo,
        selectDocPath,
      }),
    [account, repo, selectDocPath]
  );

  // TODO: this only reads the main branch
  useSyncDocTitle({ selectedDocPath, selectDocPath, repo });

  // keyboard shortcuts
  useEffect(() => {
    const keydownHandler = (event: KeyboardEvent) => {
      // toggle the sidebar open/closed when the user types cmd-backslash
      if (event.key === "\\" && event.metaKey) {
        setShowSidebar((prev) => !prev);
      }

      // if there's no document selected and the user hits enter, make a new document
      if (!selectedDocUrl && event.key === "Enter") {
        addNewDoc({ type: "essay" });
      }
    };

    window.addEventListener("keydown", keydownHandler);

    // Clean up listener on unmount
    return () => {
      window.removeEventListener("keydown", keydownHandler);
    };
  }, [addNewDoc, selectedDocUrl]);

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
          } shrink-0 bg-gray-100 border-r border-gray-400 transition-all duration-100 overflow-hidden  `}
        >
          <Sidebar
            rootFolderDoc={rootFolderData}
            selectedDocPath={selectedDocPath}
            selectDocPath={selectDocPath}
            hideSidebar={() => setShowSidebar(false)}
            addNewDocument={addNewDoc}
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
              removeDocPath={removeDocPathCallback}
              addNewDocument={addNewDoc}
              tool={currentTool}
              tools={toolDescriptions}
              onToolChange={handleToolChange}
              docHeadsFromTimelineSidebar={docHeadsFromTimelineSidebar}
            />
            <div className="flex-grow overflow-hidden z-0">
              {!selectedDocUrl && <NoDocumentSelected addNewDoc={addNewDoc} />}

              {selectedDocUrl &&
                selectedDoc &&
                toolDescriptions.length === 0 && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <p className="text-sm">
                        No tools available for datatype: {selectedDataTypeId}
                      </p>
                    </div>
                  </div>
                )}

              {/* Show loading state while tool is loading */}
              {selectedDocUrl && isLoadingTool && (
                <div className="flex items-center justify-center h-full">
                  <LoadingScreen what="tool" />
                </div>
              )}

              {/* NOTE: we set the URL as the component key, to force re-mount on URL change.
                If we want more continuity we could not do this. */}
              {selectedDocUrl &&
                selectedDocPath &&
                currentTool &&
                !isLoadingTool &&
                (currentTool.supportedDataTypes.includes(selectedDataTypeId!) ||
                  currentTool.supportedDataTypes === "*") &&
                flatDocPaths && (
                  <VersionControlEditor
                    key={DocPathUtils.toString(selectedDocPath)}
                    docPath={selectedDocPath}
                    tool={currentTool}
                    addNewDocument={addNewDoc}
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
