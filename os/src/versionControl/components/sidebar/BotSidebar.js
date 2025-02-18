import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { BotIcon, CheckIcon, EyeIcon, XIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useState } from "react";
import { Button } from "@patchwork/sdk/ui";
import { isSupportedDatatype, makeBotTextEdits, } from "@patchwork/sdk/versionControl";
import { useToast } from "@patchwork/sdk/ui";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import Markdown from "react-markdown";
import { isLLMActive } from "@patchwork/sdk/versionControl";
import { om } from "@patchwork/sdk/om";
// A string which will be visible to the bot representing user acceptance of edits.
// We won't show it to the user because that's weird, we'll just show something in the UI
const ACCEPT_MESSAGE = "Edits accepted.";
const REJECT_MESSAGE = "Edits rejected.";
export const BotSidebar = ({ doc, handle, dataType, selectedBranchUrl, setSelectedBranch, setSidebarMode, onMergeBranch, onDeleteBranch, mainDocUrl, }) => {
    const repo = useRepo();
    const [pendingMessage, setPendingMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);
    const { toast } = useToast();
    useEffect(() => {
        if (!doc.botChatHistory) {
            handle.change((d) => (d.botChatHistory = []));
        }
    }, [doc.botChatHistory, handle]);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [doc.botChatHistory, loading]);
    const handleUserMessage = async () => {
        const newMessage = {
            role: "user",
            content: pendingMessage,
        };
        handle.change((d) => {
            d.botChatHistory.push(newMessage);
        });
        setPendingMessage("");
        setLoading(true);
        try {
            const branchUrl = await makeBotTextEdits({
                repo,
                targetDocHandle: handle,
                // The doc object hasn't updated yet from the Automerge update above,
                // so we need to also tack on the message here.
                chatHistory: [...doc.botChatHistory, newMessage],
                dataType,
            });
            if (branchUrl) {
                setSelectedBranch(branchUrl);
            }
        }
        catch (e) {
            toast({ title: "Error performing edit", variant: "destructive" });
        }
        setLoading(false);
    };
    if (!isSupportedDatatype(dataType.id)) {
        return (_jsxs("div", { className: "p-2 text-sm text-gray-500 flex items-center justify-center h-full", children: ["Bots are not yet supported for datatype: ", dataType.id] }));
    }
    if (!doc.botChatHistory) {
        return null;
    }
    const lastAssistantMessage = doc.botChatHistory
        .slice()
        .reverse()
        .find((msg) => msg.role === "assistant");
    const showAcceptRejectButtons = lastAssistantMessage?.branchUrl &&
        selectedBranchUrl === lastAssistantMessage?.branchUrl;
    const acceptSuggestion = async () => {
        console.log("acceptSuggestion", selectedBranchUrl);
        handle.change((d) => {
            d.botChatHistory.push({
                role: "user",
                content: ACCEPT_MESSAGE,
            });
        });
        const branchOm = await om(selectedBranchUrl, repo);
        onMergeBranch(branchOm.url);
    };
    const rejectSuggestion = async () => {
        handle.change((d) => {
            d.botChatHistory.push({
                role: "user",
                content: REJECT_MESSAGE,
            });
        });
        // need to also do the update on the main doc because we're not merging the branch...
        const mainDocHandle = await repo.find(mainDocUrl);
        mainDocHandle.change((d) => {
            d.botChatHistory.push({
                role: "user",
                content: REJECT_MESSAGE,
            });
        });
        const branchOm = await om(selectedBranchUrl, repo);
        onDeleteBranch(branchOm.url);
    };
    const reviewSuggestion = () => {
        setSidebarMode("review");
    };
    if (!isLLMActive) {
        return (_jsx("div", { className: "flex justify-center items-center h-full p-4", children: _jsx("p", { className: "text-sm text-gray-500", children: "AI edits are disabled because OpenAI API key is not present. See README for details." }) }));
    }
    return (_jsxs("div", { className: "flex flex-col h-full p-2", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 mb-2", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(BotIcon, { size: 16 }), "Bot Editor", doc.botChatHistory.length > 0 && (_jsx("button", { className: "ml-auto text-gray-500 text-xs rounded hover:bg-gray-300", onClick: () => handle.change((d) => {
                                d.botChatHistory = [];
                            }), children: "Clear History" }))] }) }), _jsxs("div", { className: "flex-grow overflow-y-auto mb-2 flex flex-col", children: [doc.botChatHistory
                        .filter((message) => message.role !== "tool")
                        .map((message, index) => {
                        if (message.role === "user" &&
                            (message.content === ACCEPT_MESSAGE ||
                                message.content === REJECT_MESSAGE)) {
                            return (_jsxs("div", { className: "text-sm text-gray-500 w-auto inline-block self-end mr-2", children: [message.content === ACCEPT_MESSAGE && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckIcon, { size: 16 }), "Accepted"] })), message.content === REJECT_MESSAGE && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(XIcon, { size: 16 }), "Rejected"] }))] }, index));
                        }
                        return (_jsx("div", { className: `relative p-2 m-2 text-sm font-systemSans rounded-lg ${message.role === "user"
                                ? "bg-blue-500 text-white ml-auto w-2/3"
                                : "bg-gray-300 text-black mr-auto w-2/3"}`, children: _jsx(Markdown, { children: message.content }) }, index));
                    }), loading && (_jsx("div", { className: "mt-2 text-sm text-gray-500", children: "Loading..." })), showAcceptRejectButtons && (_jsxs("div", { className: "flex items-center gap-2 px-2", children: [_jsxs(Button, { variant: "default", onClick: acceptSuggestion, children: [_jsx(CheckIcon, { size: 16, className: "mr-2" }), "Accept"] }), _jsxs(Button, { variant: "default", onClick: rejectSuggestion, children: [_jsx(XIcon, { size: 16, className: "mr-2" }), "Reject"] }), _jsxs(Button, { variant: "ghost", onClick: reviewSuggestion, children: [_jsx(EyeIcon, { size: 16, className: "mr-2" }), "Review"] })] })), _jsx("div", { ref: chatEndRef })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("textarea", { value: pendingMessage, className: "flex-grow p-2 border border-gray-300 rounded h-32", onChange: (e) => setPendingMessage(e.target.value), onKeyDown: (e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleUserMessage();
                            }
                        }, placeholder: "Make it more X..." }), _jsx(Button, { onClick: handleUserMessage, children: "Send" })] })] }));
};
