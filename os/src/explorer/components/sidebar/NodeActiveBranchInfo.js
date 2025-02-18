import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { DocPathUtils } from "@patchwork/sdk/router";
import { useCurrentAccount } from "@patchwork/sdk";
import { useAsyncComputed, fetchDocHandle } from "@patchwork/sdk/async-signals";
import { fetchVersionControlMetadataOm, fetchActiveBranchInfo, } from "@patchwork/sdk/versionControl";
import { GitBranchIcon } from "lucide-react";
export const NodeActiveBranchInfo = (props) => {
    const { node } = props;
    const docPath = node.data.docPath;
    const docLink = DocPathUtils.toLink(docPath);
    const repo = useRepo();
    const account = useCurrentAccount();
    return useAsyncComputed(() => {
        // For performance reasons, we only show the active branch on
        // certain nodes to avoid eagerly loading too much data.
        // - We show it for the currently selected sidebar entry, which
        //   should already have data loaded
        // - We show it for folders, because a folder can be a branch
        //   scope for its contents, and it's helpful to see the branch
        //   name on the folder to indicate that it's a branch scope.
        const showActiveBranchName = docLink.type === "folder" || node.isSelected;
        if (!showActiveBranchName) {
            return undefined;
        }
        const doc = fetchDocHandle(docLink.url, repo).doc();
        const versionControlMetadataDoc = fetchVersionControlMetadataOm(doc, repo)?.doc;
        if (versionControlMetadataDoc?.isBranchScope) {
            const { activeBranchOm } = fetchActiveBranchInfo(docPath, account, repo);
            const activeBranchName = activeBranchOm?.doc.name ?? "Main";
            return (_jsxs("div", { className: "text-xs text-gray-500 flex items-center gap-1", children: [_jsx(GitBranchIcon, { size: 14, className: "ml-1" }), activeBranchName] }));
        }
    })
        .ifPending(() => (_jsx("div", { className: "text-xs text-gray-300 flex items-center gap-1", children: _jsx(GitBranchIcon, { size: 14, className: "ml-1" }) })))
        .ifRejected(() => _jsx("div", {})).value;
};
