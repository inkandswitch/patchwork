import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { dataTypeById, useSuggestedModuleForDocUrl, } from "@patchwork/sdk";
import { DocPathUtils } from "@patchwork/sdk/router";
import { Toaster } from "@patchwork/sdk/ui";
import { useDocument, useRepo, useDocHandle, } from "@automerge/automerge-repo-react-hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useCurrentAccount, useCurrentAccountDoc, useRootFolderDocWithMetadata, } from "@patchwork/sdk";
import { useRouter } from "@patchwork/sdk/router";
import { useSyncDocTitle } from "../hooks/useSyncDocTitle";
import { useUIStateOm } from "@patchwork/sdk/router";
import { ErrorFallback, LoadingScreen } from "@patchwork/sdk/components";
import { Sidebar } from "./sidebar/Sidebar";
import { Topbar } from "./Topbar";
import { VersionControlEditor } from "../../versionControl/components";
import { useToolsForDataType, useTool } from "@patchwork/sdk/hooks";
import { useModuleWatcher } from "../hooks/useModuleWatcher";
import { addNewDocument } from "../docActions";
import { removeDocPath } from "../docActions";
import { NoDocumentSelected } from "./NoDocumentSelected";
// A hook that runs any needed data migrations when a doc is selected and fully loaded.
// We have to be careful to only run:
// - when the handle has changed
// - when the document data for the handle has become available
const useRunMigrationsOnceOnLoad = ({ handle, dataType, }) => {
    const repo = useRepo();
    const hasRunForCurrentHandle = useRef(null);
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
                if (!dataType.migrations)
                    return;
                for (const migration of dataType.migrations) {
                    if (await migration.migrationNeedsToRun(handle, repo)) {
                        console.log(`Running migration "${migration.description}" on document ${handle.url}`);
                        await migration.runMigration(handle, repo);
                    }
                }
            })();
            hasRunForCurrentHandle.current = handleId;
        }
    }, [handle, doc, dataType, repo]);
};
export const Explorer = () => {
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
    const selectedDocLink = selectedDocPath && DocPathUtils.toLink(selectedDocPath);
    const selectedDocUrl = selectedDocLink?.url;
    const selectedDocHandle = useDocHandle(selectedDocUrl);
    const [selectedDoc] = useDocument(selectedDocUrl);
    const { watcher } = useModuleWatcher();
    useSuggestedModuleForDocUrl(selectedDocUrl, watcher);
    useEffect(() => {
        // @ts-expect-error global window
        window.handle = selectedDocHandle;
        // @ts-expect-error global window
        window.flatDocPaths = flatDocPaths;
    }, [selectedDocHandle, flatDocPaths]);
    const selectedDocName = selectedDocLink?.name;
    const selectedDataTypeId = selectedDocLink?.type;
    const selectedDataType = dataTypeById(selectedDataTypeId);
    useRunMigrationsOnceOnLoad({
        handle: selectedDocHandle,
        dataType: selectedDataType,
    });
    const toolsForSelection = useToolsForDataType(selectedDataTypeId);
    const [selectedToolId, setSelectedToolId] = useState();
    const selectedTool = useTool(selectedToolId);
    const currentTool = 
    // make sure the current tool is reset to the fallback tool
    // if the selected datatype changes and the selected tool is not compatible
    selectedTool &&
        (selectedTool.supportedDataTypes === "*" ||
            selectedTool.supportedDataTypes.some((supportedDataType) => supportedDataType === selectedDataTypeId))
        ? selectedTool
        : toolsForSelection[0];
    const uiStateOm = useUIStateOm();
    const account = useCurrentAccount();
    const [docHeadsFromTimelineSidebar, setDocHeadsFromTimelineSidebar] = useState();
    const addNewDoc = useCallback((args) => addNewDocument({
        ...args,
        uiStateOm,
        repo,
        selectedDocPath,
        selectedDataTypeId,
        selectDocPath,
        rootFolderUrl,
        account,
    }), [
        uiStateOm,
        repo,
        selectedDocPath,
        selectedDataTypeId,
        selectDocPath,
        rootFolderUrl,
        account,
    ]);
    const removeDocPathCallback = useCallback((docPath) => removeDocPath({
        docPath,
        account,
        repo,
        selectDocPath,
    }), [account, repo, selectDocPath]);
    // TODO: this only reads the main branch
    useSyncDocTitle({ selectedDocPath, selectDocPath, repo });
    // update tab title to be the selected doc
    useEffect(() => {
        document.title = selectedDocName ?? "Patchwork";
    }, [selectedDocName]);
    // keyboard shortcuts
    useEffect(() => {
        const keydownHandler = (event) => {
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
        return _jsx(LoadingScreen, { what: "account" });
    }
    if (!rootFolderDoc) {
        return _jsx(LoadingScreen, { what: "your documents" });
    }
    return (_jsxs(ErrorBoundary, { FallbackComponent: ErrorFallback, children: [_jsxs("div", { className: "flex flex-row w-screen h-screen overflow-hidden", children: [_jsx("div", { className: `${showSidebar ? "w-64" : "w-0 translate-x-[-100%]"} flex-shrink-0 bg-gray-100 border-r border-gray-400 transition-all duration-100 overflow-hidden  `, children: _jsx(Sidebar, { rootFolderDoc: rootFolderData, selectedDocPath: selectedDocPath, selectDocPath: selectDocPath, hideSidebar: () => setShowSidebar(false), addNewDocument: addNewDoc }) }), _jsx("div", { className: `flex-grow relative h-screen overflow-hidden ${!selectedDocUrl ? "bg-gray-200" : ""}`, children: _jsxs("div", { className: "flex flex-col h-screen", children: [_jsx(Topbar, { showSidebar: showSidebar, setShowSidebar: setShowSidebar, selectDocPath: selectDocPath, selectedDocPath: selectedDocPath, selectedDoc: selectedDoc, selectedDocHandle: selectedDocHandle, removeDocPath: removeDocPathCallback, addNewDocument: addNewDoc, setToolId: setSelectedToolId, tool: currentTool, tools: toolsForSelection, docHeadsFromTimelineSidebar: docHeadsFromTimelineSidebar }), _jsxs("div", { className: "flex-grow overflow-hidden z-0", children: [!selectedDocUrl && _jsx(NoDocumentSelected, { addNewDoc: addNewDoc }), selectedDocUrl &&
                                            selectedDoc &&
                                            toolsForSelection.length === 0 && (_jsx("div", { className: "flex items-center justify-center h-full text-gray-500", children: _jsx("div", { className: "text-center", children: _jsxs("p", { className: "text-sm", children: ["No tools available for datatype: ", selectedDataTypeId] }) }) })), selectedDocUrl &&
                                            selectedDocPath &&
                                            currentTool &&
                                            (currentTool.supportedDataTypes.includes(selectedDataTypeId) ||
                                                currentTool.supportedDataTypes.includes("*")) &&
                                            flatDocPaths && (_jsx(VersionControlEditor, { docPath: selectedDocPath, tool: currentTool, addNewDocument: addNewDoc, flatDocPaths: flatDocPaths, docHeadsFromTimelineSidebar: docHeadsFromTimelineSidebar, setDocHeadsFromTimelineSidebar: setDocHeadsFromTimelineSidebar }, DocPathUtils.toString(selectedDocPath)))] })] }) })] }), _jsx(Toaster, {})] }));
};
