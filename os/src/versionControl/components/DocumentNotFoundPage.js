import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { toHashUrl } from "@patchwork/sdk";
import { CrownIcon } from "lucide-react";
export const DocumentNotFoundPage = ({ branchScopeAndActiveBranchInfo, docLink, }) => {
    const selectedBranchName = branchScopeAndActiveBranchInfo.activeBranchOm?.doc.name;
    return (_jsx("div", { className: "flex items-center justify-center h-full bg-gray-100", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Document not found" }), _jsxs("p", { className: "text-gray-700 mb-4", children: [_jsxs("span", { className: "bg-white border border-gray-300 shadow-sm px-2 py-1 rounded-md inline-flex gap-1 items-center", children: [!selectedBranchName && _jsx(CrownIcon, { className: "inline", size: 12 }), selectedBranchName ?? "Main"] }), " ", "does not contain the document", " ", _jsx("span", { className: "font-bold", children: docLink.name }), "."] }), _jsx("p", { className: "text-gray-600", children: "It may have been deleted or not yet created on this branch." }), _jsx("p", { className: "mt-4", children: _jsx("a", { href: toHashUrl({
                            type: "folder",
                            url: branchScopeAndActiveBranchInfo.branchScopeOm.url,
                            name: "",
                        }), className: "text-blue-600 hover:underline", children: "Go to root of branch" }) })] }) }));
};
