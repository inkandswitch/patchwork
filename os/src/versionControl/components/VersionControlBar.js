import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { fetchAwaitMissing, useAsyncComputed, } from "@patchwork/sdk/async-signals";
import { useCurrentAccount } from "@patchwork/sdk";
import { ContactAvatar } from "@patchwork/sdk/components";
import { selectDocLink } from "@patchwork/sdk";
import { useDocUIState } from "@patchwork/sdk/router";
import { getRelativeTimeString } from "@patchwork/sdk/versionControl";
import { DocPathUtils } from "@patchwork/sdk/router";
import { ensureMetadataHandleIsBranchScope, initVersionControlSidecarDoc, } from "@patchwork/sdk/versionControl";
import { Button } from "@patchwork/sdk/ui";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@patchwork/sdk/ui";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, } from "@patchwork/sdk/ui";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@patchwork/sdk/ui";
import { useToast } from "@patchwork/sdk/ui";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { BuildRefreshButton, DisabledBuildRefreshButton, } from "@patchwork/jacquard/components";
import { getStalenessInfo } from "@patchwork/jacquard";
import { fetchJacquardProjectInfoWithActiveBranch, } from "@patchwork/jacquard/hooks";
import { fetchProjectStateFromProjectInfo, getBuildRunsWithDocAsPrimaryInput, } from "@patchwork/jacquard/signals";
import truncate from "lodash-es/truncate";
import { ArrowRightFromLineIcon, ArrowRightToLineIcon, ChevronsDownUpIcon, ColumnsIcon, CrownIcon, Edit3Icon, FileDiffIcon, FileIcon, GitBranchIcon, Link, MergeIcon, MessageSquareIcon, MoreHorizontal, PlusIcon, Trash2Icon, ChevronDownIcon, ChevronRightIcon, InfoIcon, } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createBranch, hasLegacyBranchesToMigrate, migrateLegacyBranches, } from "@patchwork/sdk/versionControl";
// interface MakeBranchOptions {
//   name?: string;
//   heads?: A.Heads;
// }
const VerticalSeparator = _jsx("div", { className: "h-8 w-px bg-gray-300 mx-2" });
const BranchSelectItem = ({ branchOm, isActive }) => {
    return (_jsxs(SelectItem, { className: `${isActive ? "font-medium" : ""}`, value: branchOm.url, children: [_jsx("div", { children: branchOm.doc.name }), _jsxs("div", { className: "ml-auto text-xs text-gray-600 flex gap-1", children: [branchOm.doc.createdAt && (_jsx("div", { children: getRelativeTimeString(branchOm.doc.createdAt) })), _jsx("span", { children: "by" }), branchOm.doc.createdBy && (_jsx(ContactAvatar, { url: branchOm.doc.createdBy, size: "sm", showName: true, showImage: false }))] })] }, branchOm.url));
};
export const VersionControlBar = ({ docPath, tool, branchScopeAndActiveBranchInfo, highlightSidebarButton, diffMode, onSelectBranch, onMergeBranch, onDeleteBranch, }) => {
    const docLink = DocPathUtils.toLink(docPath);
    const { branchScopeOm, activeBranchOm, branchOms, cloneOrMainOm, isRealBranchScope, branchScopeVersionControlMetadataOm, branchScopePath, } = branchScopeAndActiveBranchInfo;
    const { toast } = useToast();
    const repo = useRepo();
    const account = useCurrentAccount();
    const [docUIState, changeDocUIState] = useDocUIState(docPath);
    const handleCreateBranch = useCallback(async () => {
        const branchScopeLink = DocPathUtils.toLink(branchScopePath);
        const branchUrl = (await createBranch({
            repo,
            branchScopeHandle: branchScopeOm.handle,
            dataTypeId: branchScopeLink?.type,
            createdBy: account?.contactHandle?.url,
        })).url;
        onSelectBranch(branchUrl);
        toast({ title: "Created a new branch" });
    }, [
        branchScopePath,
        repo,
        branchScopeOm.handle,
        account?.contactHandle?.url,
        onSelectBranch,
        toast,
    ]);
    const isInsideBranchScope = isRealBranchScope && branchScopeOm?.url !== docLink.url;
    const jacquardProjectInfo = useAsyncComputed(useCallback(() => {
        fetchAwaitMissing(account);
        return fetchJacquardProjectInfoWithActiveBranch(docPath, account, repo);
    }, [account, docPath, repo])).ifPending(undefined).value;
    const projectState = useAsyncComputed(useCallback(() => {
        fetchAwaitMissing(jacquardProjectInfo);
        return fetchProjectStateFromProjectInfo(jacquardProjectInfo, repo);
    }, [jacquardProjectInfo, repo])).ifPending(undefined).value;
    const buildRunWithFileAsInput = useMemo(() => projectState &&
        getBuildRunsWithDocAsPrimaryInput(projectState, docLink.url), [projectState, docLink.url]);
    const hasOutputFiles = buildRunWithFileAsInput && buildRunWithFileAsInput.length > 0;
    // const rebaseBranch = (draftUrl: AutomergeUrl) => {
    //   const draftHandle =
    //     repo.find<HasVersionControlMetadata<unknown, unknown>>(draftUrl);
    //   const docHandle =
    //     repo.find<HasVersionControlMetadata<unknown, unknown>>(docUrl);
    //   draftHandle.merge(docHandle);
    //   draftHandle.change((doc) => {
    //     doc.branchMetadata.source.branchHeads = decodeHeads(docHandle.heads());
    //   });
    //   toast("Incorporated updates from main");
    // };
    const activeBranches = branchOms.filter((branchOm) => branchOm && !branchOm.doc.mergeMetadata);
    const mergedBranches = branchOms.filter((branchOm) => branchOm && branchOm.doc.mergeMetadata);
    const [showMergedBranches, setShowMergedBranches] = useState(false);
    const onSelectValueChange = useCallback((value) => {
        if (value === "__newBranch") {
            handleCreateBranch();
        }
        else if (value === "__makeIntoBranchScope") {
            if (!branchScopeVersionControlMetadataOm) {
                initVersionControlSidecarDoc(cloneOrMainOm, repo, {
                    branchScope: true,
                });
            }
            else {
                ensureMetadataHandleIsBranchScope(branchScopeVersionControlMetadataOm.handle);
            }
        }
        else if (value === "__moveChangesToBranch") {
            throw new Error("not implemented");
        }
        else {
            const selectedBranchUrl = value === "__main" ? null : value;
            if (selectedBranchUrl) {
                onSelectBranch(selectedBranchUrl);
                toast({ title: "Switched to branch" });
            }
            else {
                onSelectBranch(null);
                toast({ title: "Switched to Main" });
            }
        }
    }, [
        handleCreateBranch,
        branchScopeVersionControlMetadataOm,
        cloneOrMainOm,
        repo,
        onSelectBranch,
        toast,
    ]);
    const [needsMigration, setNeedsMigration] = useState(false);
    useEffect(() => {
        const checkMigration = async () => {
            const result = await hasLegacyBranchesToMigrate({
                docOm: cloneOrMainOm,
                branchScopeAndActiveBranchInfo,
            });
            setNeedsMigration(result ?? false);
        };
        checkMigration();
    }, [cloneOrMainOm, branchScopeAndActiveBranchInfo, repo, docLink.type]);
    return (_jsxs("div", { className: "bg-gray-100 pl-4 py-2 flex gap-2 border-b border-gray-200", children: [_jsxs("div", { className: "flex flex-col gap-0.5", children: [_jsxs(Select, { value: activeBranchOm?.url ?? "__main", onValueChange: onSelectValueChange, children: [_jsx(SelectTrigger, { className: "h-8 text-sm w-[14rem] font-medium", children: _jsxs(SelectValue, { children: [activeBranchOm ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(GitBranchIcon, { className: "inline", size: 12 }), truncate(activeBranchOm.doc.name, { length: 30 })] })) : isRealBranchScope ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CrownIcon, { className: "inline", size: 12 }), "Main"] })) : (_jsx("div", { className: "flex items-center gap-2 opacity-50", children: "No branches" })), " "] }) }), _jsxs(SelectContent, { className: "w-72", children: [_jsxs(SelectItem, { value: "__newBranch", className: "font-regular", children: [_jsx(PlusIcon, { className: "inline mr-1", size: 12 }), "Create new branch"] }, "__newBranch"), _jsxs(SelectGroup, { children: [_jsxs(SelectLabel, { className: "-ml-5 mt-2", children: ["Active Branches (", activeBranches.length + (isRealBranchScope ? 1 : 0), ")"] }), isRealBranchScope && (_jsxs(SelectItem, { value: "__main", className: !activeBranchOm ? "font-medium" : "", children: [_jsx(CrownIcon, { className: "inline mr-1", size: 12 }), "Main"] }))] }), _jsx(SelectGroup, { children: activeBranches.map((branchOm) => (_jsx(BranchSelectItem, { branchOm: branchOm, isActive: activeBranchOm?.url === branchOm.url }, branchOm.url))) }), mergedBranches.length > 0 && (_jsxs(SelectGroup, { children: [_jsxs(SelectLabel, { className: "-ml-5 mt-2 cursor-pointer flex items-center", onClick: (e) => {
                                                    e.preventDefault();
                                                    setShowMergedBranches(!showMergedBranches);
                                                }, children: [showMergedBranches ? (_jsx(ChevronDownIcon, { className: "inline mr-1", size: 12 })) : (_jsx(ChevronRightIcon, { className: "inline mr-1", size: 12 })), _jsx(MergeIcon, { className: "inline mr-1", size: 12 }), "Merged Branches (", mergedBranches.length, ")"] }), showMergedBranches && (_jsx("div", { className: "mt-1", children: mergedBranches.map((branchOm) => (_jsx(BranchSelectItem, { branchOm: branchOm, isActive: false }, branchOm.url))) }))] })), !isRealBranchScope && (_jsx(SelectItem, { value: "__makeIntoBranchScope", className: "font-regular mt-2", children: _jsxs("div", { className: "opacity-50", children: [_jsx(PlusIcon, { className: "inline mr-1", size: 12 }), "Convert to main branch"] }) }, "__makeIntoBranchScope"))] })] }), isInsideBranchScope && (_jsxs("div", { className: "pl-2 text-xs text-gray-500 cursor-default", children: ["branch of", " ", _jsx("span", { className: "underline cursor-pointer", onClick: () => selectDocLink({
                                    url: branchScopeOm?.url,
                                    name: "fake",
                                    type: "folder",
                                }), children: branchScopeOm.doc.title })] }))] }), needsMigration && (_jsxs("div", { className: "flex h-8 items-center bg-red-100 border border-red-400 text-red-700 rounded text-xs p-1", role: "alert", children: [_jsx("span", { className: "mr-2", children: "Legacy branches detected." }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { delayDuration: 0, children: [_jsx(TooltipTrigger, { children: _jsx(InfoIcon, { className: "h-5 w-5 text-red-700 mr-2" }) }), _jsx(TooltipContent, { className: "text-xs max-w-96", children: _jsx("p", { children: "This document has branches which were created in an older version of Patchwork. Click Upgrade to make these branches compatible with the current version of Patchwork." }) })] }) }), _jsx(Button, { onClick: () => {
                            migrateLegacyBranches({
                                docOm: cloneOrMainOm,
                                branchScopeAndActiveBranchInfo,
                                repo,
                                dataTypeId: docLink.type,
                            });
                        }, variant: "destructive", size: "sm", className: "text-xs h-6", children: "Upgrade" })] })), _jsxs("div", { className: "flex gap-1", children: [activeBranchOm && (_jsx("div", { children: _jsxs(Button, { disabled: activeBranchOm.doc.mergeMetadata?.mergedAt !== undefined, onClick: (e) => {
                                if (!window.confirm("Are you sure you want to merge this branch to main?")) {
                                    return;
                                }
                                onMergeBranch(activeBranchOm.url);
                                e.stopPropagation();
                            }, variant: "outline", className: "h-8 px-2 text-xs", children: [_jsx(MergeIcon, { className: "h-4 w-4 mr-1" }), "Merge"] }) })), activeBranchOm && branchScopeVersionControlMetadataOm && (_jsx("div", { className: "mt-2 ml-1", children: _jsx(BranchActions, { activeBranchOm: activeBranchOm, branchScopeVersionControlMetadataOm: branchScopeVersionControlMetadataOm, onSelectBranch: onSelectBranch, onDeleteBranch: onDeleteBranch }) }))] }), jacquardProjectInfo && projectState && (_jsxs(_Fragment, { children: [VerticalSeparator, _jsx(JacquardSection, { jacquardProjectInfo: jacquardProjectInfo, projectState: projectState, datatypeId: docLink.type })] })), VerticalSeparator, (activeBranchOm || docLink.type === "file") && (_jsxs(Select, { onValueChange: (value) => {
                    changeDocUIState((state) => (state.mainViewMode = value));
                }, value: docUIState.mainViewMode, children: [_jsxs(SelectTrigger, { className: "h-8 px-2 text-xs w-20", children: [docUIState.mainViewMode === "showFile" && (_jsx(FileIcon, { className: "mr-2 h-4 w-4" })), docUIState.mainViewMode === "showInputs" && (_jsx(ArrowRightToLineIcon, { className: "mr-2 h-4 w-4" })), docUIState.mainViewMode === "showOutputs" && (_jsx(ArrowRightFromLineIcon, { className: "mr-2 h-4 w-4" })), docUIState.mainViewMode === "compareWithMain" && (_jsx(ColumnsIcon, { className: "mr-2 h-4 w-4" })), "View"] }), _jsx(SelectContent, { children: _jsxs(SelectGroup, { children: [_jsx(SelectItem, { value: "showFile", children: _jsxs("div", { className: "flex gap-2", children: [_jsx(FileIcon, { className: "h-4 w-4" }), "Show just this doc"] }) }), hasOutputFiles && (_jsx(SelectItem, { value: "showOutputs", children: _jsxs("div", { className: "flex gap-2", children: [_jsx(ArrowRightFromLineIcon, { className: "h-4 w-4" }), "Show with build outputs"] }) })), activeBranchOm && (_jsx(SelectItem, { value: "compareWithMain", children: _jsxs("div", { className: "flex gap-2", children: [_jsx(ColumnsIcon, { className: "h-4 w-4" }), "Compare with main"] }) }))] }) })] })), diffMode !== undefined && (_jsxs(_Fragment, { children: [_jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", onClick: () => changeDocUIState((state) => {
                                            if (state.highlightChanges) {
                                                state.collapseContentWithoutChanges = false;
                                            }
                                            state.highlightChanges = !state.highlightChanges;
                                        }), className: `h-8 px-2 text-xs ${docUIState.highlightChanges
                                            ? "shadow-inner shadow-gray-300 border-gray-400 "
                                            : "shadow-none"}`, children: [_jsx(FileDiffIcon, { className: "h-4 w-4 mr-1" }), _jsx("span", { className: "whitespace-nowrap text-ellipsis", children: "Highlight changes" })] }) }), _jsxs(TooltipContent, { children: [diffMode === "branch" && (_jsx("p", { children: "Highlight changes compared to main" })), diffMode === "history" && (_jsx("p", { children: "Highlight changes from history selection" }))] })] }) }), tool.supportsCollapseContentWithoutAnnotations && (_jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", onClick: () => changeDocUIState((state) => {
                                            if (!state.collapseContentWithoutChanges) {
                                                state.highlightChanges = true;
                                            }
                                            state.collapseContentWithoutChanges =
                                                !state.collapseContentWithoutChanges;
                                        }), className: `h-8 px-2 text-xs ${docUIState.collapseContentWithoutChanges
                                            ? "shadow-inner shadow-gray-300 border-gray-400 "
                                            : "shadow-none"}`, children: [_jsx(ChevronsDownUpIcon, { className: "h-4 w-4 mr-1" }), _jsx("span", { className: "whitespace-nowrap text-ellipsis", children: "Focus" })] }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Only show changed sections" }) })] }) }))] })), !docUIState.sidebarMode && (_jsx("div", { className: "ml-auto mr-4", children: _jsx("div", { className: "flex items-center gap-2", children: _jsxs(Button, { onClick: () => changeDocUIState((state) => {
                            state.sidebarMode = "review";
                        }), variant: "outline", className: `h-8 text-xs ${highlightSidebarButton
                            ? "bg-yellow-200 hover:bg-yellow-400"
                            : ""}`, children: [_jsx(MessageSquareIcon, { size: 16, className: "mr-2" }), "Review"] }) }) }))] }));
};
const BranchActions = ({ activeBranchOm, onDeleteBranch }) => {
    const { toast } = useToast();
    const handleRenameBranch = useCallback(() => {
        const newName = prompt("Enter the new name for this branch:");
        const newNameTrimmed = newName?.trim();
        if (newNameTrimmed) {
            activeBranchOm.handle.change((d) => {
                d.name = newNameTrimmed;
            });
        }
    }, [activeBranchOm.handle]);
    const handleDeleteBranchClick = useCallback(() => {
        if (!window.confirm("Are you sure you want to delete this branch?")) {
            return;
        }
        onDeleteBranch(activeBranchOm.url);
    }, [activeBranchOm.url, onDeleteBranch]);
    // const branchHeads = useMemo(
    //   () => (branchDoc ? JSON.stringify(A.getHeads(branchDoc)) : undefined),
    //   [branchDoc]
    // );
    const [dropdownOpen, setDropdownOpen] = useState(false);
    // const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
    // // compute new name suggestions anytime the branch heads change
    // // todo: seems like this should run outside of the react UI...
    // useEffect(() => {
    //   if (!dropdownOpen || !doc || !branchDoc) return;
    //   if (!isMarkdownDoc(doc) || !isMarkdownDoc(branchDoc)) {
    //     console.warn("suggestions only work for markdown docs");
    //     return;
    //   }
    //   if (!isLLMActive) return;
    //   setNameSuggestions([]);
    //   (async () => {
    //     const suggestions = (
    //       await suggestBranchName({ doc, branchUrl, branchDoc })
    //     ).split("\n");
    //     setNameSuggestions(suggestions);
    //   })();
    // }, [doc, branchDoc, branchUrl, branchHeads, dropdownOpen]);
    return (_jsxs(DropdownMenu, { open: dropdownOpen, onOpenChange: setDropdownOpen, children: [_jsx(DropdownMenuTrigger, { children: _jsx(MoreHorizontal, { size: 18, className: " text-gray-500 hover:text-gray-800" }) }), _jsxs(DropdownMenuContent, { className: "mr-4 w-72", children: [_jsxs(DropdownMenuItem, { onClick: handleRenameBranch, children: [_jsx(Edit3Icon, { className: "inline-block text-gray-500 mr-2", size: 14 }), " ", "Rename branch"] }), _jsxs(DropdownMenuItem, { onClick: handleDeleteBranchClick, children: [_jsx(Trash2Icon, { className: "inline-block text-gray-500 mr-2", size: 14 }), " ", "Delete branch"] }), _jsxs(DropdownMenuItem, { onClick: () => {
                            navigator.clipboard.writeText(activeBranchOm.url).then(() => {
                                toast({ title: "Link copied to clipboard" });
                            }, () => {
                                toast({
                                    title: "Failed to copy link to clipboard",
                                    variant: "destructive",
                                });
                            });
                        }, children: [_jsx(Link, { className: "inline-block text-gray-500 mr-2", size: 14 }), " Copy branch Automerge URL"] })] })] }));
};
const JacquardSection = ({ jacquardProjectInfo, projectState, datatypeId, }) => {
    const stalenessInfo = getStalenessInfo(projectState);
    const numStaleDocs = stalenessInfo
        ? Object.values(stalenessInfo.docStatuses).reduce((acc, docStatus) => acc + docStatus.length, 0)
        : 0;
    const enableRefreshButton = jacquardProjectInfo?.buildMetadataOm && numStaleDocs > 0;
    return (_jsxs("div", { className: "flex flex-col gap-0.5", children: [enableRefreshButton ? (_jsx(BuildRefreshButton, { projectBuildMetadataOm: jacquardProjectInfo.buildMetadataOm, projectState: projectState, alignTooltip: "start" })) : (_jsx(DisabledBuildRefreshButton, {})), _jsxs("div", { className: "text-xs text-gray-500", children: [numStaleDocs > 0 && (_jsxs("span", { children: [numStaleDocs, " file", numStaleDocs > 1 && "s", " to rebuild"] })), numStaleDocs === 0 && _jsx("span", { children: "project up to date" }), datatypeId !== "jacquard-build-metadata" && (_jsx("span", { className: "underline cursor-pointer ml-1", onClick: () => selectDocLink({
                            url: jacquardProjectInfo.buildMetadataMainDocUrl,
                            name: "Build Metadata",
                            type: "jacquard-build-metadata",
                        }), children: "see details" }))] })] }));
};
