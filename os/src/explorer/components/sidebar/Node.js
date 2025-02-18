import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DocPathUtils } from "@patchwork/sdk/router";
import { dataTypeById } from "@patchwork/sdk";
import { Icon, TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, } from "@patchwork/sdk/ui";
import { AlertCircle } from "lucide-react";
import { createContext, useContext, useMemo } from "react";
import { NodeActiveBranchInfo } from "./NodeActiveBranchInfo";
import { Edit } from "./Edit";
export const FlatDocPathsContext = createContext([]);
export const Node = (props) => {
    const { node, style, dragHandle } = props;
    const docPath = node.data.docPath;
    const docLink = DocPathUtils.toLink(docPath);
    const dataType = dataTypeById(docLink.type);
    const flatDocPaths = useContext(FlatDocPathsContext);
    // We often end up in a situation where a doc that's deep in some
    // folder structure is also present at the top level, cuz it was
    // loaded that way first. This is a little feature to identify such
    // cases.
    const redundantWithPath = useMemo(() => {
        if (docPath.length > 2) {
            return;
        }
        return flatDocPaths.find((otherDocPath) => {
            if (otherDocPath.length > 2) {
                const otherDocLink = DocPathUtils.toLink(otherDocPath);
                return docLink.url === otherDocLink.url;
            }
        });
    }, [docLink.url, docPath.length, flatDocPaths]);
    let icon;
    if (docLink.type === "folder") {
        if (node.isOpen) {
            icon = "ChevronDown";
        }
        else {
            icon = "ChevronRight";
        }
    }
    else {
        icon = dataType?.icon;
    }
    return (_jsxs("div", { style: style, ref: dragHandle, className: `flex items-center cursor-pointer text-sm py-1 w-full truncate ${node.isSelected
            ? " bg-gray-300 hover:bg-gray-300 text-gray-900"
            : "text-gray-600 hover:bg-gray-200"}`, onDoubleClick: () => node.edit(), children: [_jsx("div", { className: `${node.isSelected ? "text-gray-800" : "text-gray-500"} ${docLink.type === "folder" && "hover:bg-gray-400 text-gray-800"} p-1 mr-0.5 rounded-sm transition-all`, onClick: (e) => {
                    if (docLink.type === "folder") {
                        node.toggle();
                        e.stopPropagation();
                    }
                }, children: _jsx(Icon, { type: icon, size: 14 }) }), !node.isEditing && (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "", children: dataType ? docLink.name : `Unknown type: ${docLink.type}` }), docLink.type === "folder" && (_jsx("div", { className: "ml-2 text-gray-500 text-xs py-0.5 px-1.5 rounded-lg bg-gray-200", children: node.children?.length || 0 })), _jsx(NodeActiveBranchInfo, { ...props }), redundantWithPath && (_jsx(TooltipProvider, { delayDuration: 0, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { className: "ml-1", children: _jsx("div", { className: "ml-1", children: _jsx(AlertCircle, { size: 14 }) }) }), _jsxs(TooltipContent, { className: "text-xs text-gray-500", children: ["In ", DocPathUtils.toLink(redundantWithPath).name] })] }) }))] })), node.isEditing && _jsx(Edit, { ...props })] }));
};
