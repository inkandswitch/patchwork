import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { isValidAutomergeUrl } from "@automerge/automerge-repo";
import { Icon, Input, Popover, PopoverContent, PopoverTrigger, } from "@patchwork/sdk/ui";
import { useState } from "react";
export const OpenAutomergeUrl = ({ addNewDocument }) => {
    // state related to open popover
    const [openNewDocPopoverVisible, setOpenNewDocPopoverVisible] = useState(false);
    const [openUrlInput, setOpenUrlInput] = useState("");
    const automergeUrlMatch = openUrlInput
        .replace(/%3A/g, ":")
        .match(/(automerge:[a-zA-Z0-9]*)/);
    const automergeUrlToOpen = automergeUrlMatch &&
        automergeUrlMatch[1] &&
        isValidAutomergeUrl(automergeUrlMatch[1])
        ? automergeUrlMatch[1]
        : null;
    return (_jsx("div", { className: "py-1 px-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-200 ", onClick: () => setOpenNewDocPopoverVisible(true), children: _jsxs(Popover, { open: openNewDocPopoverVisible, onOpenChange: setOpenNewDocPopoverVisible, children: [_jsxs(PopoverTrigger, { children: [_jsx(Icon, { type: "FolderInput", size: 14, className: "inline-block font-bold mr-2 align-top mt-[2px]" }), "Open document..."] }), _jsxs(PopoverContent, { className: "w-96 h-20", side: "right", children: [_jsx(Input, { value: openUrlInput, placeholder: "automerge:<url>", onChange: (e) => setOpenUrlInput(e.target.value), onKeyDown: (e) => {
                                if (e.key === "Enter" && automergeUrlToOpen) {
                                    alert("This is broken.");
                                    // addNewDocument(... something)
                                    // openDocFromUrl(automergeUrlToOpen); // TODO FIX THIS
                                    setOpenUrlInput("");
                                    setOpenNewDocPopoverVisible(false);
                                }
                            }, className: `outline-none ${automergeUrlToOpen
                                ? "bg-green-100"
                                : openUrlInput.length > 0
                                    ? "bg-red-100"
                                    : ""}` }), _jsxs("div", { className: "text-xs text-gray-500 text-right mt-1", children: [automergeUrlToOpen && _jsxs(_Fragment, { children: [" ", "\u23CE", " Enter to open "] }), openUrlInput.length > 0 &&
                                    !automergeUrlToOpen &&
                                    "Not a valid Automerge URL"] })] })] }) }));
};
