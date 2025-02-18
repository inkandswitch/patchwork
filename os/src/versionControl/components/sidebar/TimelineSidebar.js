import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useDocument, useDocHandle, useRepo, } from "@automerge/automerge-repo-react-hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { groupingByEditTime, } from "@patchwork/sdk/versionControl";
import { InlineContactAvatar } from "@patchwork/sdk/components";
import { useSlots } from "@patchwork/sdk/versionControl";
import { ChevronLeftIcon, CrownIcon, GitBranchIcon, GitBranchPlusIcon, } from "lucide-react";
import { useAutoPopulateChangeGroupSummaries } from "@patchwork/sdk/versionControl";
import { DiscussionInput } from "../DiscussionInput";
import { MarkdownInput } from "@patchwork/sdk/markdown";
import { ChangeGrouper, } from "@patchwork/sdk/versionControl";
const useScrollToBottom = (doc) => {
    const scrollerRef = useRef(null);
    useEffect(() => {
        void doc; // TODO: JAH I think we're supposed to react to this changing?
        if (scrollerRef.current) {
            scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
        }
    }, [doc]);
    return scrollerRef;
};
const useTimelineItems = (branchScopeAndActiveBranchInfo, options) => {
    const [items, setItems] = useState([]);
    const handle = branchScopeAndActiveBranchInfo.cloneOrMainOm.handle;
    const { activeBranchOm, baseHeads, branchOms, branchScopePath, branchScopeVersionControlMetadataOm, isRealBranchScope, originalUrl, } = branchScopeAndActiveBranchInfo;
    // BranchScopeAndActiveBranchInfo updates every time the document changes because it contains an Om of the current document
    // We don't want to remount the ChangeGrouper on every key stroke so we create a version of BranchScopeAndActiveBranchInfo with the document
    // The change grouper manually subscribes to changes on the doc through the handle we pass in
    const branchScopeAndActiveBranchInfoWithoutDoc = useMemo(() => ({
        activeBranchOm,
        baseHeads,
        branchOms,
        branchScopePath,
        branchScopeVersionControlMetadataOm,
        isRealBranchScope,
        originalUrl,
    }), [
        activeBranchOm,
        baseHeads,
        branchOms,
        branchScopePath,
        branchScopeVersionControlMetadataOm,
        isRealBranchScope,
        originalUrl,
    ]);
    useEffect(() => {
        const grouper = new ChangeGrouper(handle, options, branchScopeAndActiveBranchInfoWithoutDoc);
        if (grouper.items) {
            setItems(grouper.items);
        }
        const listener = (items) => {
            setItems(items);
        };
        grouper.on("change", listener);
        return () => {
            console.log("remount change grouper");
            grouper.off("change", listener);
            grouper.teardown();
        };
    }, [handle, options, branchScopeAndActiveBranchInfoWithoutDoc]);
    return items;
};
export const TimelineSidebar = ({ dataType, docUrl, branchScopeAndActiveBranchInfo, setDocHeads, setDiff, onSelectBranchUrl, }) => {
    const repo = useRepo();
    const selectedBranchDoc = branchScopeAndActiveBranchInfo.activeBranchOm?.doc;
    const [doc] = useDocument(docUrl);
    const handle = useDocHandle(docUrl); // TODO: JAH strict fix
    const scrollerRef = useScrollToBottom(doc);
    const [showHiddenItems, setShowHiddenItems] = useState(false);
    const { includeChangeInHistory, includePatchInChangeGroup, promptForAIChangeGroupSummary: promptForAutoChangeGroupDescription, fallbackSummaryForChangeGroup, groupChanges, } = dataType ?? {};
    // todo: extract this as an interface that different doc types can implement
    const changeGroupingOptions = useMemo(() => ({
        grouping: groupChanges ?? groupingByEditTime(30),
        includeChangeInHistory,
        includePatchInChangeGroup,
        fallbackSummaryForChangeGroup,
    }), [
        groupChanges,
        includeChangeInHistory,
        includePatchInChangeGroup,
        fallbackSummaryForChangeGroup,
    ]);
    const changelogItems = useTimelineItems(branchScopeAndActiveBranchInfo, changeGroupingOptions);
    const hiddenItemBoundary = changelogItems.findIndex((item) => item.type === "originOfThisBranch" && item.hideHistoryBeforeThis);
    let visibleItems = changelogItems;
    if (hiddenItemBoundary > 0 && !showHiddenItems) {
        visibleItems = visibleItems.slice(hiddenItemBoundary);
    }
    // Within a branch, don't show new branches created after this branch started
    /* if (selectedBranchDoc) {
      const originIndex = visibleItems.findIndex(
        (item) => item.type === "originOfThisBranch"
      );
      visibleItems = visibleItems.filter((item, index) => {
        if (item.type === "branchCreatedFromThisDoc" && index > originIndex) {
          return false;
        }
        return true;
      });
    }*/
    const { selection, handleClick, clearSelection, itemsContainerRef } = useChangelogSelection({
        items: changelogItems ?? [],
        setDiff,
        setDocHeads,
    });
    const changeGroups = useMemo(() => {
        return changelogItems.flatMap((item) => {
            if (item.type === "changeGroup") {
                return [item.changeGroup];
            }
            else if (item.type === "otherBranchMergedIntoThisDoc") {
                return item.changeGroups;
            }
            else {
                return [];
            }
        });
    }, [changelogItems]);
    useAutoPopulateChangeGroupSummaries({
        changeGroups,
        handle,
        promptForAutoChangeGroupDescription,
        repo,
    });
    if (!doc)
        return null;
    return (_jsxs("div", { className: "h-full w-full flex flex-col text-xs text-gray-600", children: [_jsxs("div", { className: "bg-gray-50 border-gray-200 border-b", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "cursor-pointer text-gray-500 font-semibold underline w-12 flex-shrink-0", onClick: () => {
                                    onSelectBranchUrl(null);
                                }, children: selectedBranchDoc && (_jsxs(_Fragment, { children: [_jsx(ChevronLeftIcon, { size: 12, className: "inline" }), "Main"] })) }), _jsx("div", { className: "flex-grow flex justify-center items-center px-2 py-1 text-sm", children: _jsxs("div", { className: "font-medium text-gray-800", children: [!selectedBranchDoc && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CrownIcon, { className: "inline", size: 12 }), "Main"] })), selectedBranchDoc && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(GitBranchIcon, { className: "inline", size: 12 }), selectedBranchDoc.name] }))] }) }), _jsx("div", { className: "w-12 flex-shrink-0" })] }), selection && (_jsxs("div", { className: "absolute flex gap-2 p-2 bg-gray-100 z-10 w-full border-b border-t border-gray-300", children: [_jsxs("div", { className: "text-blue-600 font-medium", children: ["Showing ", selection.to.index - selection.from.index + 1, " change", selection.to.index === selection.from.index ? "" : "s"] }), _jsx("div", { className: "cursor-pointer text-gray-500 font-semibold underline", onClick: clearSelection, children: "Reset to now" })] }))] }), _jsxs("div", { className: "bg-gray-100 overflow-auto flex-1 flex flex-col pb-4 relative", ref: scrollerRef, children: [_jsx("div", { className: "timeline-line" }), _jsxs("div", { className: "relative mt-auto flex flex-col", ref: itemsContainerRef, children: [_jsx("div", { className: "pl-6 text-xs  text-gray-500", children: !showHiddenItems && hiddenItemBoundary > 0 && (_jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { children: [hiddenItemBoundary + 1, " items before branch creation"] }), _jsx("div", { className: "font-semibold cursor-pointer underline", onClick: () => setShowHiddenItems(true), children: "show" })] })) }), visibleItems.map((item, index) => {
                                const selected = (selection &&
                                    index >= selection.from.index &&
                                    index <= selection.to.index) ||
                                    false;
                                const prevItem = changelogItems[index - 1];
                                const prevItemDateTime = prevItem?.time
                                    ? new Date(prevItem.time).toLocaleDateString()
                                    : undefined;
                                const currentItemDateTime = item.time
                                    ? new Date(item.time).toLocaleDateString()
                                    : undefined;
                                const dateChangedFromPrevItem = prevItemDateTime !== currentItemDateTime;
                                return (_jsxs(_Fragment, { children: [dateChangedFromPrevItem && (_jsx("div", { className: "text-xs text-gray-400", children: _jsx(DateHeader, { timestamp: item.time }) })), _jsxs("div", { "data-item-id": item.id, className: `p-2 cursor-default select-none w-full flex items-start gap-2 ${selected ? "bg-blue-100 bg-opacity-20" : ""}`, onClick: (e) => handleClick({
                                                itemId: item.id,
                                                shiftPressed: e.shiftKey,
                                            }), children: [(() => {
                                                    switch (item.type) {
                                                        case "changeGroup":
                                                            return (_jsx(ChangeGroupItem, { group: item.changeGroup, doc: doc, selected: selected }));
                                                        case "branchCreatedFromThisDoc":
                                                            return (_jsx(BranchCreatedItem, { branch: item.branchOm.doc, selected: selected }));
                                                        case "discussionThread":
                                                            return (_jsx(DiscussionThreadItem, { discussion: item.discussion, docHandle: handle, selected: selected }));
                                                        case "originOfThisBranch":
                                                            return (_jsx(BranchOriginItem, { branch: item.branchOm.doc, selected: selected }));
                                                        case "otherBranchMergedIntoThisDoc":
                                                            return (_jsx(BranchMergedItem, { doc: doc, branch: item.branchOm.doc, selected: selected, changeGroups: item.changeGroups }));
                                                        default: {
                                                            // Ensure we've handled all types, if an
                                                            const exhaustiveCheck = item;
                                                            return exhaustiveCheck;
                                                        }
                                                    }
                                                })(), item.type !== "discussionThread" && (_jsxs("div", { className: "ml-auto flex-shrink-0 flex items-center gap-2", children: [_jsx("div", { className: "flex items-center space-x-[-4px]", children: item.users.map((contactUrl) => (_jsx("div", { className: "rounded-full", children: _jsx(InlineContactAvatar, { url: contactUrl, size: "sm", showName: false }, contactUrl) }, contactUrl))) }), _jsx("div", { className: "mt-1 -mx-1" })] }))] }, item.id)] }));
                            }), selection && (_jsx("div", { className: "absolute left-1 right-1 border-2 border-blue-600 rounded-lg transition-all duration-200 pointer-events-none", style: {
                                    top: selection.from.yPos,
                                    height: selection.to.yPos - selection.from.yPos,
                                } }))] })] }), _jsx("div", { className: "bg-gray-50 z-10", children: _jsx(DiscussionInput, { doc: doc, handle: handle, changelogItems: changelogItems, changelogSelection: selection }) })] }));
};
// Manage the selection state for changelog items.
// Supports multi-select interaction.
// Returns pixel coordinates for the selection to help w/ drawing a selection box.
const useChangelogSelection = function ({ items, setDiff, setDocHeads, }) {
    // Internally we track selection using item IDs.
    // Once we return it out of the hook, we'll also tack on numbers, to help out in the view.
    const [selection, setSelection] = useState(undefined);
    // sync the diff and docHeads up to the parent component when the selection changes
    useEffect(() => {
        if (!selection) {
            setDiff(undefined);
            setDocHeads(undefined);
        }
        const fromItemIndex = items.findIndex((item) => item.id === selection?.from);
        const previousItem = items[fromItemIndex - 1];
        const fromItem = items[fromItemIndex];
        const toItem = items.find((item) => item.id === selection?.to);
        const fromIndex = items.findIndex((item) => item.id === selection?.from);
        const toIndex = items.findIndex((item) => item.id === selection?.to);
        if (!fromItem || !toItem) {
            return;
        }
        setDocHeads(toItem.heads);
        // The diff consists of diffs from any change groups in the selected items.
        const selectedItems = items.slice(fromIndex, toIndex + 1);
        const patches = selectedItems
            .flatMap((item) => {
            if (item.type === "changeGroup") {
                return item.changeGroup.diff.patches;
            }
            else if (item.type === "otherBranchMergedIntoThisDoc") {
                return item.changeGroups.flatMap((group) => group.diff.patches);
            }
        })
            .filter((patch) => patch !== undefined);
        setDiff({
            patches,
            fromHeads: previousItem?.heads ?? [],
            toHeads: toItem.heads,
        });
    }, [selection, setDiff, setDocHeads, items]);
    const itemsContainerRef = useRef(null);
    const handleClick = ({ itemId, shiftPressed, }) => {
        if (!shiftPressed) {
            setSelection({ from: itemId, to: itemId });
            return;
        }
        // If the shift key is pressed, we create a multi-change selection.
        // If there's no existing change group selected, just use the latest as the starting point for the selection.
        if (!selection) {
            const to = items[items.length - 1].id;
            setSelection({ from: itemId, to });
            return;
        }
        // If there was already a selection, extend it.
        const fromIndex = items.findIndex((item) => item.id === selection.from);
        const clickedIndex = items.findIndex((item) => item.id === itemId);
        if (clickedIndex < fromIndex) {
            setSelection({ from: itemId, to: selection.to });
            return;
        }
        else {
            setSelection({ from: selection.from, to: itemId });
            return;
        }
    };
    if (!selection || !itemsContainerRef.current) {
        return {
            selection: undefined,
            handleClick,
            itemsContainerRef,
            clearSelection: () => setSelection(undefined),
        };
    }
    const fromIndex = items.findIndex((item) => item.id === selection?.from);
    const toIndex = items.findIndex((item) => item.id === selection?.to);
    const containerChildren = [
        ...(itemsContainerRef.current?.children ?? []),
    ];
    const fromElement = containerChildren.find((div) => div.dataset.itemId === selection.from);
    const toElement = containerChildren.find((div) => div.dataset.itemId === selection.to);
    if (!fromElement || !toElement) {
        return {
            selection: undefined,
            handleClick,
            itemsContainerRef,
            clearSelection: () => setSelection(undefined),
        };
    }
    const containerTop = itemsContainerRef.current.getBoundingClientRect().top;
    const fromPos = fromElement.getBoundingClientRect().top - containerTop;
    const toPos = toElement.getBoundingClientRect().bottom - containerTop;
    return {
        selection: {
            from: {
                itemId: selection.from,
                index: fromIndex,
                yPos: fromPos,
            },
            to: {
                itemId: selection.to,
                index: toIndex,
                yPos: toPos,
            },
        },
        handleClick,
        itemsContainerRef,
        clearSelection: () => setSelection(undefined),
    };
};
const ChangeGroupItem = ({ group, doc }) => {
    return (_jsxs("div", { className: "pl-[7px] pr-1 flex w-full", children: [_jsx("div", { className: "flex-shrink-0 w-3 h-3 border-b-2 border-l-2 border-gray-300 rounded-bl-full" }), _jsx(ChangeGroupDescription, { changeGroup: group, doc: doc })] }));
};
const DateHeader = ({ timestamp }) => {
    return (_jsxs("div", { className: "text-sm font-normal text-gray-300 px-4 flex items-center justify-between p-1 w-full", children: [_jsx("hr", { className: "flex-grow border-t border-gray-200 mr-2 ml-4" }), _jsx("div", { children: timestamp
                    ? new Date(timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        weekday: "long",
                    })
                    : "Date unknown" })] }));
};
// Summary of a change group: textual + avatars
const ChangeGroupDescription = ({ changeGroup, doc, }) => {
    const [versionControlSidecarDoc] = useDocument(doc.versionControlMetadataUrl);
    let summary;
    if (!versionControlSidecarDoc ||
        !versionControlSidecarDoc.changeGroupSummaries ||
        !versionControlSidecarDoc.changeGroupSummaries[changeGroup.id]) {
        summary = changeGroup.fallbackSummary;
    }
    else {
        summary =
            versionControlSidecarDoc.changeGroupSummaries[changeGroup.id].title;
    }
    return (_jsx("div", { className: `group  p-1 rounded-full font-medium text-xs flex`, children: _jsx("div", { className: "mr-2 text-gray-500", children: summary }) }));
};
const BranchMergedItem = ({ doc, branch, changeGroups, selected }) => {
    return (_jsxs(ItemView, { selected: selected, color: "purple", children: [_jsx(ItemActionMessage, { children: "branch merged" }), _jsx(ItemIcon, { children: _jsx(GitBranchPlusIcon, { className: "h-[10px] w-[10px] text-white", strokeWidth: 2 }) }), _jsx(ItemContent, { children: _jsxs("div", { className: "text-sm flex flex-col gap-1 select-none", children: [_jsxs("div", { children: [_jsx("div", { className: "inline font-semibold", children: branch.name }), " "] }), changeGroups.map((group) => (_jsxs("div", { className: "flex", children: [_jsx(ChangeGroupDescription, { changeGroup: group, doc: doc }), _jsx("div", { className: "flex flex-shrink-0 items-start space-x-[-4px]", children: group.authorUrls.map((contactUrl) => (_jsx("div", { className: "rounded-full", children: _jsx(InlineContactAvatar, { url: contactUrl, size: "sm", showName: false }, contactUrl) }, contactUrl))) })] }, group.id)))] }) })] }));
};
const BranchCreatedItem = ({ branch, selected, }) => {
    return (_jsxs(ItemView, { selected: selected, color: "neutral", children: [_jsx(ItemActionMessage, { children: "branch created" }), _jsx(ItemIcon, { children: _jsx(GitBranchIcon, { className: "h-[10px] w-[10px] text-neutral-600" }) }), _jsx(ItemContent, { children: _jsx("div", { children: _jsx("div", { className: "text-sm flex select-none items-center", children: _jsxs("div", { className: "mb-1", children: [_jsx("div", { className: "inline font-semibold", children: branch.name }), " "] }) }) }) })] }));
};
const BranchOriginItem = ({ branch, selected, }) => {
    return (_jsxs(ItemView, { selected: selected, color: "green", children: [_jsx(ItemActionMessage, { children: "this branch started" }), _jsx(ItemIcon, { children: _jsx(GitBranchIcon, { className: "h-[10px] w-[10px] text-white" }) }), _jsx(ItemContent, { children: _jsx("div", { children: _jsx("div", { className: "text-sm flex select-none items-center", children: _jsxs("div", { className: "mb-1", children: [_jsx("div", { className: "inline font-semibold", children: branch.name }), " "] }) }) }) })] }));
};
// Show a discussion thread about the document.
// We only show discussions about the whole doc in this timeline view,
// not discussions about specific parts of the doc.
// We only show the first comment in the thread (replying isn't supported yet)
const DiscussionThreadItem = ({ discussion, docHandle, }) => {
    const comment = discussion.comments[0];
    return (_jsxs("div", { className: "ml-6 mr-16 my-0 w-full min-h-12 flex gap-1 bg-yellow-50 border-yellow-100 text-xs p-2 shadow-md select-none", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(InlineContactAvatar, { size: "default", url: comment.contactUrl, showName: false }) }), _jsx("div", { className: "font-normal text-gray-800 -ml-1 -my-1", children: _jsx(MarkdownInput, { value: comment.content.trim(), docHandle: docHandle }) })] }));
};
const ItemIcon = ({ children }) => _jsx(_Fragment, { children: children });
const ItemContent = ({ children }) => _jsx(_Fragment, { children: children });
const ItemActionMessage = ({ children }) => (_jsx(_Fragment, { children: children }));
const ItemView = ({ children, color = "neutral", }) => {
    const [slots] = useSlots(children, {
        icon: ItemIcon,
        content: ItemContent,
        actionMessage: ItemActionMessage,
    });
    const tailwindColor = {
        purple: "bg-purple-600",
        green: "bg-green-600",
        neutral: "bg-neutral-300",
        orange: "bg-amber-600",
    }[color] ?? "bg-neutral-600";
    return (_jsxs("div", { className: "items-top flex gap-1 w-full pr-4", children: [slots.icon && (_jsx("div", { className: `${tailwindColor} mt-1.5 flex h-[16px] w-[16px] items-center justify-center rounded-full  outline outline-2 outline-gray-100`, children: slots.icon })), !slots.icon && _jsx("div", { className: "w-[16px] h-[16px] mt-1.5" }), _jsxs("div", { className: "flex-1 flex-grow px-1", children: [slots.actionMessage && (_jsx("div", { className: "my-1 font-medium text-gray-500", children: slots.actionMessage })), _jsx("div", { className: `bg-white flex-1 rounded py-1 px-2 shadow`, children: slots.content })] })] }));
};
