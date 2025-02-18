import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@patchwork/sdk/ui";
import { useCurrentAccount } from "@patchwork/sdk";
import { MarkdownInput } from "@patchwork/sdk/markdown";
import { uuid } from "@automerge/automerge";
import { decodeHeads } from "@automerge/automerge-repo";
import { SendHorizontalIcon } from "lucide-react";
import { useState } from "react";
export const DiscussionInput = function ({ doc, handle, changelogItems, changelogSelection, }) {
    const account = useCurrentAccount();
    const [commentBoxContent, setCommentBoxContent] = useState("");
    // only allow comments on most recent version
    const isInputDisabled = changelogSelection !== undefined;
    const createDiscussion = () => {
        if (commentBoxContent === "" || !account) {
            return;
        }
        /** migration for legacy docs */
        const comment = {
            id: uuid(),
            content: commentBoxContent,
            timestamp: Date.now(),
            contactUrl: account.contactHandle.url,
        };
        const discussionId = uuid();
        handle.change((doc) => {
            if (!doc.discussions) {
                doc.discussions = {};
            }
            doc.discussions[discussionId] = {
                id: discussionId,
                heads: decodeHeads(handle.heads()),
                resolved: false,
                comments: [comment],
                anchors: [],
            };
        });
        setCommentBoxContent("");
    };
    const onKeyDown = (evt) => {
        if (evt.key === "Enter" && (evt.ctrlKey || evt.metaKey)) {
            evt.stopPropagation();
            evt.preventDefault();
            createDiscussion();
        }
    };
    return (_jsxs("div", { className: "border-t border-gray-200 pt-2 px-2 bg-gray-50 z-10", children: [_jsx("div", { children: _jsxs("div", { className: "rounded bg-white shadow", children: [_jsx("div", { className: "p-1", onKeyDownCapture: onKeyDown, children: _jsx(MarkdownInput, { value: commentBoxContent, onChange: changelogSelection ? undefined : setCommentBoxContent, docHandle: handle }) }), _jsx("div", { className: "flex justify-end mt-2 text-sm", children: _jsx("div", { className: "flex items-center", children: _jsxs(Button, { variant: "ghost", onClick: createDiscussion, disabled: isInputDisabled, children: [_jsx(SendHorizontalIcon, { size: 14, className: "mr-1" }), "Write a note", _jsx("span", { className: "text-gray-400 text-xs ml-2", children: "(\u2318+enter)" })] }) }) })] }) }), " "] }));
};
