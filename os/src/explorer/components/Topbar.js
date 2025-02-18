import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { DocPathUtils } from "@patchwork/sdk/router";
import { dataTypeById, getExportMethodsForDatatype, } from "@patchwork/sdk";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@patchwork/sdk/ui";
import { Tabs, TabsList, TabsTrigger } from "@patchwork/sdk/ui";
import { useToast } from "@patchwork/sdk/ui";
import * as Automerge from "@automerge/automerge";
import { isValidAutomergeUrl } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { Download, GitForkIcon, Menu, MoreHorizontal, ShareIcon, Trash2Icon, } from "lucide-react";
import { useRef } from "react";
import { saveFile } from "@patchwork/sdk/files";
import { AccountPicker } from "./AccountPicker";
import { AUTOMERGE_SYNC_SERVER_STORAGE_ID, SyncIndicator, } from "./SyncIndicator";
export const Topbar = ({ showSidebar, setShowSidebar, selectDocPath, selectedDocPath, selectedDoc, selectedDocHandle, tools, tool, setToolId: setToolModuleId, removeDocPath, docHeadsFromTimelineSidebar, }) => {
    const repo = useRepo();
    const { toast } = useToast();
    const selectedDocLink = selectedDocPath && DocPathUtils.toLink(selectedDocPath);
    const selectedDocUrl = selectedDocLink?.url;
    const selectedDocName = selectedDocLink?.name;
    const selectedDataTypeId = selectedDocLink?.type;
    const selectedDataTypeRef = useRef();
    selectedDataTypeRef.current = selectedDataTypeId;
    const selectedDataType = dataTypeById(selectedDataTypeId);
    const toolsWithEditorComponent = tools.filter((tool) => tool.EditorComponent);
    const onClickMakeCopy = async () => {
        if (!selectedDocHandle ||
            !selectedDataType ||
            !selectedDocPath ||
            !selectedDocLink) {
            // TODO: JAH strict fix lazy
            throw new Error("something unexpected is missing idk");
        }
        let newHandle;
        if (docHeadsFromTimelineSidebar) {
            newHandle = repo.create();
            const originalDoc = selectedDocHandle.doc();
            if (!originalDoc) {
                throw new Error("can't load doc");
            }
            const changes = Automerge.getAllChanges(originalDoc);
            let cutOff = 0;
            for (const change of changes) {
                cutOff += 1;
                const decodeChange = Automerge.decodeChange(change);
                if (decodeChange.hash === docHeadsFromTimelineSidebar[0]) {
                    break;
                }
            }
            const [docAtHeads] = Automerge.applyChanges(Automerge.init(), changes.slice(0, cutOff));
            newHandle.update((doc) => Automerge.merge(doc, docAtHeads));
        }
        else {
            newHandle =
                repo.clone(selectedDocHandle);
        }
        newHandle.change((doc) => {
            selectedDataType.markCopy(doc);
        });
        const newDocLink = {
            url: newHandle.url,
            name: await selectedDataType.getTitle(newHandle.doc(), repo),
            type: selectedDocLink.type,
        };
        const folderDocPath = DocPathUtils.parent(selectedDocPath);
        if (!docHeadsFromTimelineSidebar) {
            const folderHandle = await repo.find(DocPathUtils.toLink(folderDocPath).url);
            const folderDoc = folderHandle.doc();
            const index = folderDoc.docs.findIndex((doc) => doc.url === selectedDocUrl);
            folderHandle.change((doc) => doc.docs.splice(index + 1, 0, newDocLink));
        }
        // TODO: we used to have a setTimeout here, see if we need to bring it back.
        selectDocPath([...folderDocPath, newDocLink]);
    };
    const onClickExport = async (method) => {
        if (!selectedDoc || !selectedDocLink) {
            throw new Error("something unexpected is missing idk");
        }
        const file = await method.exportData(selectedDoc, repo);
        const extension = file.name.split(".").pop();
        saveFile(file, [
            {
                accept: {
                    [file.type]: [`.${extension}`],
                },
            },
        ]);
    };
    const exportMethods = selectedDataType
        ? getExportMethodsForDatatype(selectedDataType)
        : [];
    return (_jsxs("div", { className: "h-10 bg-gray-100 flex items-center flex-shrink-0 border-b border-gray-300", children: [!showSidebar && (_jsx("div", { className: "ml-1 p-1 text-gray-500 bg-gray-100 hover:bg-gray-300 hover:text-gray-500 cursor-pointer  transition-all rounded-sm", onClick: () => setShowSidebar(!showSidebar), children: _jsx(Menu, { size: 18 }) })), _jsx("div", { className: "ml-3 text-sm text-gray-700 font-bold", children: selectedDocName }), _jsx("div", { className: "ml-1 mt-[-2px] flex items-center", children: isValidAutomergeUrl(selectedDocUrl) && (_jsx(_Fragment, { children: _jsx(SyncIndicator, { docUrl: selectedDocUrl, storageId: AUTOMERGE_SYNC_SERVER_STORAGE_ID, name: "sync.automerge.org" }) })) }), toolsWithEditorComponent.length > 1 && selectedDocLink && (_jsx(Tabs, { value: tool?.id, className: "ml-auto", onValueChange: setToolModuleId, children: _jsx(TabsList, { children: toolsWithEditorComponent.map((tool) => (_jsx(TabsTrigger, { value: tool.id, className: "px-2 py-1", children: tool.name }, tool.id))) }) })), _jsx("div", { className: `mr-4 ${tools.length <= 1 ? "ml-auto" : "ml-4"}`, children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { children: _jsx(MoreHorizontal, { size: 18, className: "mt-1 mr-21 text-gray-500 hover:text-gray-800" }) }), selectedDoc && (_jsxs(DropdownMenuContent, { className: "mr-4", children: [_jsxs(DropdownMenuItem, { onClick: () => {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast({ title: "Copied to clipboard" });
                                    }, children: [_jsx(ShareIcon, { className: "inline-block text-gray-500 mr-2", size: 14 }), " ", "Copy share URL"] }), _jsxs(DropdownMenuItem, { onClick: () => {
                                        if (!selectedDocPath) {
                                            toast({ title: "No document selected" });
                                            return;
                                        }
                                        navigator.clipboard.writeText(DocPathUtils.toLink(selectedDocPath).url);
                                        toast({ title: "Copied to clipboard" });
                                    }, children: [_jsx(ShareIcon, { className: "inline-block text-gray-500 mr-2", size: 14 }), " ", "Copy Automerge URL"] }), _jsxs(DropdownMenuItem, { onClick: onClickMakeCopy, children: [_jsx(GitForkIcon, { className: "inline-block text-gray-500 mr-2", size: 14 }), " ", !docHeadsFromTimelineSidebar
                                            ? "Make a copy of latest version"
                                            : "Make a copy of visible version"] }), _jsx(DropdownMenuSeparator, {}), exportMethods.map((method) => (_jsxs(DropdownMenuItem, { onClick: () => onClickExport(method), children: [_jsx(Download, { size: 14, className: "inline-block text-gray-500 mr-2" }), " ", "Export as ", method.name] }, method.id))), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => selectedDocPath && removeDocPath(selectedDocPath), children: [_jsx(Trash2Icon, { className: "inline-block text-gray-500 mr-2", size: 14 }), " ", "Remove doc from folder"] })] })), !selectedDoc && (_jsx(DropdownMenuContent, { className: "mr-4 p-4", children: _jsx("div", { className: "text-gray-500 text-xs", children: "Open a document to see actions" }) }))] }) }), _jsx("div", { className: "mr-4 mt-1", children: _jsx(AccountPicker, {}) })] }));
};
