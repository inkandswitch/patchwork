import {
  MainViewMode,
  useCurrentAccount,
  useDocumentUIState,
} from "@/explorer/account";
import { ContactAvatar } from "@/explorer/components/ContactAvatar";
import { selectDocLink } from "@/explorer/hooks/useSelectedDocLink";
import { getRelativeTimeString } from "@/lib/dates";
import { Om } from "@/om";
import { DocPath, FolderDoc } from "@/packages/folder/datatype";
import {
  BranchDoc,
  ensureMetadataHandleIsBranchScope,
  useDataTypes,
  VersionControlSidecarDoc,
} from "@/sdk";
import { Button } from "@/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shadcn/ui/tooltip";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import _, { truncate } from "lodash";
import {
  ArrowRightFromLineIcon,
  ArrowRightToLineIcon,
  ColumnsIcon,
  CrownIcon,
  Edit3Icon,
  FileDiffIcon,
  FileIcon,
  GitBranchIcon,
  Link,
  MergeIcon,
  MessageSquareIcon,
  MoreHorizontal,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { createJacquardBranch, mergeBranch } from "../branches";
import { BranchScopeAndActiveBranchInfo } from "../signals";
import { useJacquardProjectInfoWithActiveBranch } from "@patchwork/jacquard/src/hooks";
import { ifLoaded, useDocReactive, waitForDR } from "@/doc-reactive";
import { getStalenessInfo } from "@patchwork/jacquard/src/getStalenessInfo";
import {
  getBuildRunsWithDocAsPrimaryInput,
  getProjectStateFromProjectInfo,
} from "@patchwork/jacquard/src/signals";
import {
  BuildRefreshButton,
  DisabledBuildRefreshButton,
} from "@patchwork/jacquard/src/components/BuildRefreshButton";

// interface MakeBranchOptions {
//   name?: string;
//   heads?: A.Heads;
// }

const VerticalSeparator = <div className="h-8 w-px bg-gray-300 mx-2" />;

export const VersionControlBar = ({
  docUrl,
  datatypeId,
  branchScopeAndActiveBranchInfo,
  highlightSidebarButton,
  getFakeDocPathForDocUrl,
}: {
  docUrl: AutomergeUrl;
  datatypeId: string;
  branchScopeAndActiveBranchInfo: BranchScopeAndActiveBranchInfo;
  highlightSidebarButton: boolean;
  getFakeDocPathForDocUrl: (docUrl: AutomergeUrl) => DocPath;
}) => {
  const {
    branchScopeOm,
    setActiveBranchUrl,
    activeBranchOm,
    branchOms,
    isRealBranchScope,
    branchScopeVersionControlMetadataOm,
  } = branchScopeAndActiveBranchInfo;

  const repo = useRepo();
  const dataTypes = useDataTypes();
  const account = useCurrentAccount();

  const [docUIState, changeDocUIState] = useDocumentUIState(
    getFakeDocPathForDocUrl(docUrl)
  );

  const handleCreateJacquardBranch = useCallback(async () => {
    const docPathForBranchScope = getFakeDocPathForDocUrl(branchScopeOm.url);
    const docLinkForBranchScope = _.last(docPathForBranchScope)!;

    const branchUrl = await createJacquardBranch({
      repo,
      branchScopeHandle: branchScopeOm.handle,
      dataTypeId: docLinkForBranchScope?.type,
      dataTypes,
      createdBy: account?.contactHandle?.url,
    });
    setActiveBranchUrl(branchUrl);
    toast("Created a new branch");
  }, [
    account?.contactHandle?.url,
    branchScopeOm?.handle,
    branchScopeOm?.url,
    dataTypes,
    getFakeDocPathForDocUrl,
    repo,
    setActiveBranchUrl,
  ]);

  const isInsideBranchScope =
    isRealBranchScope && branchScopeOm?.url !== docUrl;

  // const moveCurrentChangesToBranch = () => {
  //   if (!isMarkdownDoc(doc))
  //     throw new Error(
  //       "No content to move to branch; this only works for MarkdownDoc now"
  //     );

  //   // todo: only pull in changes the author made themselves?
  //   const latestText = doc.content;
  //   const textBeforeEditSession = A.view(doc, sessionStartHeads).content;

  //   // revert content of main to before edit session started
  //   handle.change((doc) => {
  //     A.updateText(doc, ["content"], textBeforeEditSession);
  //   });

  //   // Branch off after the revert is done -- this means that our
  //   // change to add back the edits won't be clobbered when we merge
  //   const branchHandle = handleCreateBranch();
  //   branchHandle.change((doc) => {
  //     A.updateText(doc, ["content"], latestText);
  //   });

  //   setSessionStartHeads(A.getHeads(doc));
  //   setIsHoveringYankToBranchOption(false);
  // };

  const jacquardProjectInfo = useJacquardProjectInfoWithActiveBranch(
    getFakeDocPathForDocUrl(docUrl)
  );

  const projectState = ifLoaded(
    useDocReactive(
      useCallback(() => {
        waitForDR(jacquardProjectInfo);

        if (!jacquardProjectInfo) {
          return;
        }

        return getProjectStateFromProjectInfo(jacquardProjectInfo, repo);
      }, [jacquardProjectInfo, repo])
    )
  );

  const stalenessInfo = projectState
    ? getStalenessInfo(projectState)
    : undefined;

  const numStaleDocs = stalenessInfo
    ? Object.values(stalenessInfo.docStatuses).reduce(
        (acc, docStatus) => acc + docStatus.length,
        0
      )
    : 0;

  const buildRunWithFileAsInput = ifLoaded(
    useDocReactive(
      useCallback(() => {
        waitForDR(projectState);
        return getBuildRunsWithDocAsPrimaryInput(projectState, docUrl);
      }, [projectState, docUrl])
    )
  );

  const hasOutputFiles = buildRunWithFileAsInput?.length > 0;

  const enableRefreshButton =
    jacquardProjectInfo?.buildMetadataOm && numStaleDocs > 0;

  const handleMergeBranch = useCallback(
    (activeBranchOm: Om<BranchDoc>) => {
      if (!account) {
        throw new Error(
          "Cannot merge branch without account information for `mergedBy`"
        );
      }

      mergeBranch({
        repo,
        branchOm: activeBranchOm,
        mergedBy: account.contactHandle.url,
      });
      setActiveBranchUrl(null);
      toast.success("Branch merged to main");
    },
    [account, repo, setActiveBranchUrl]
  );

  // const rebaseBranch = (draftUrl: AutomergeUrl) => {
  //   const draftHandle =
  //     repo.find<HasVersionControlMetadata<unknown, unknown>>(draftUrl);
  //   const docHandle =
  //     repo.find<HasVersionControlMetadata<unknown, unknown>>(docUrl);
  //   draftHandle.merge(docHandle);
  //   draftHandle.change((doc) => {
  //     doc.branchMetadata.source.branchHeads = A.getHeads(docHandle.docSync());
  //   });

  //   toast("Incorporated updates from main");
  // };

  return (
    <div className="bg-gray-100 pl-4 py-2 flex gap-2 border-b border-gray-200">
      <div className="flex flex-col gap-0.5">
        <Select
          value={activeBranchOm?.url ?? null} // select doesn't like undefined
          onValueChange={(value) => {
            if (value === "__newBranch") {
              handleCreateJacquardBranch();
            } else if (value === "__makeIntoBranchScope") {
              ensureMetadataHandleIsBranchScope(
                branchScopeVersionControlMetadataOm.handle
              );
            } else if (value === "__moveChangesToBranch") {
              throw new Error("not implemented");
            } else {
              const selectedBranchUrl = value as AutomergeUrl | null;

              if (selectedBranchUrl) {
                setActiveBranchUrl(selectedBranchUrl);
                toast(`Switched to branch`);
              } else {
                setActiveBranchUrl(null);
                toast("Switched to Main");
              }
            }
          }}
        >
          <SelectTrigger className="h-8 text-sm w-[14rem] font-medium">
            <SelectValue>
              {activeBranchOm ? (
                <div className="flex items-center gap-2">
                  <GitBranchIcon className="inline" size={12} />
                  {truncate(activeBranchOm.doc.name, { length: 30 })}
                </div>
              ) : isRealBranchScope ? (
                <div className="flex items-center gap-2">
                  <CrownIcon className="inline" size={12} />
                  Main
                </div>
              ) : (
                <div className="flex items-center gap-2 opacity-50">
                  No branches
                </div>
              )}{" "}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="w-72">
            {isRealBranchScope && (
              <SelectItem
                value={null}
                className={!activeBranchOm ? "font-medium" : ""}
              >
                <CrownIcon className="inline mr-1" size={12} />
                Main
              </SelectItem>
            )}
            <SelectGroup>
              <SelectLabel className="-ml-5">
                <GitBranchIcon className="inline mr-1" size={12} />
                Branches
              </SelectLabel>

              {/* for now only show open branches here; maybe in future show a list of merged branches */}
              {branchOms.map(
                (branchOm) =>
                  branchOm && (
                    <SelectItem
                      key={branchOm.url}
                      className={`${
                        activeBranchOm?.url === branchOm.url
                          ? "font-medium"
                          : ""
                      }`}
                      value={branchOm.url}
                    >
                      <div>{branchOm.doc.name}</div>
                      <div className="ml-auto text-xs text-gray-600 flex gap-1">
                        {branchOm.doc.createdAt && (
                          <div>
                            {getRelativeTimeString(branchOm.doc.createdAt)}
                          </div>
                        )}
                        <span>by</span>
                        {branchOm.doc.createdBy && (
                          <ContactAvatar
                            url={branchOm.doc.createdBy}
                            size="sm"
                            showName
                            showImage={false}
                          />
                        )}
                      </div>
                    </SelectItem>
                  )
              )}
              <SelectItem
                value={"__newBranch"}
                key={"__newBranch"}
                className="font-regular"
              >
                <PlusIcon className="inline mr-1" size={12} />
                Create new branch
              </SelectItem>
              {!isRealBranchScope && (
                <SelectItem
                  value={"__makeIntoBranchScope"}
                  key={"__makeIntoBranchScope"}
                  className="font-regular"
                >
                  <div className="opacity-50">
                    <PlusIcon className="inline mr-1" size={12} />
                    Convert to main branch
                  </div>
                </SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
        {isInsideBranchScope && (
          <div className="pl-2 text-xs text-gray-500 cursor-default">
            branch of{" "}
            <span
              className="underline cursor-pointer"
              onClick={() =>
                selectDocLink({
                  url: branchScopeOm?.url,
                  name: "fake",
                  type: "folder", // TODO: figure out what to do if we have non folder branch scopes
                })
              }
            >
              {/* TODO: only folders can contain documents, so far... */}
              {(branchScopeOm.doc as FolderDoc).title}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-1">
        {activeBranchOm && (
          <div>
            <Button
              onClick={(e) => {
                if (
                  !window.confirm(
                    "Are you sure you want to merge this branch to main?"
                  )
                ) {
                  return;
                }

                handleMergeBranch(activeBranchOm);
                e.stopPropagation();
              }}
              variant="outline"
              className="h-8 px-2 text-xs"
            >
              <MergeIcon className="h-4 w-4 mr-1" />
              Merge
            </Button>
          </div>
        )}

        {activeBranchOm && (
          <div className="mt-2 ml-1">
            <BranchActions
              activeBranchOm={activeBranchOm}
              branchScopeVersionControlMetadataOm={
                branchScopeVersionControlMetadataOm
              }
              setActiveBranchUrl={setActiveBranchUrl}
            />
          </div>
        )}
      </div>

      {VerticalSeparator}

      <div className="flex flex-col gap-0.5">
        {enableRefreshButton ? (
          <BuildRefreshButton
            projectBuildMetadataOm={jacquardProjectInfo.buildMetadataOm}
            projectState={projectState}
            alignTooltip="start"
          />
        ) : (
          <DisabledBuildRefreshButton />
        )}

        <div className="text-xs text-gray-500">
          {numStaleDocs > 0 && <span>{numStaleDocs} files to rebuild</span>}
          {numStaleDocs === 0 && <span>project up to date</span>}
          {datatypeId !== "jacquard-build-metadata" && (
            <span
              className="underline cursor-pointer ml-1"
              onClick={() =>
                selectDocLink({
                  url: jacquardProjectInfo.buildMetadataMainDocUrl,
                  name: "Build Metadata",
                  type: "jacquard-build-metadata",
                })
              }
            >
              see details
            </span>
          )}
        </div>
      </div>

      {VerticalSeparator}

      {(activeBranchOm || datatypeId === "file") && (
        <Select
          onValueChange={(value) => {
            changeDocUIState(
              (state) => (state.mainViewMode = value as MainViewMode)
            );
          }}
          value={docUIState.mainViewMode}
        >
          <SelectTrigger className="h-8 px-2 text-xs w-20">
            {docUIState.mainViewMode === "showFile" && (
              <FileIcon className="mr-2 h-4 w-4" />
            )}
            {docUIState.mainViewMode === "showInputs" && (
              <ArrowRightToLineIcon className="mr-2 h-4 w-4" />
            )}
            {docUIState.mainViewMode === "showOutputs" && (
              <ArrowRightFromLineIcon className="mr-2 h-4 w-4" />
            )}
            {docUIState.mainViewMode === "compareWithMain" && (
              <ColumnsIcon className="mr-2 h-4 w-4" />
            )}
            View
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="showFile">
                <div className="flex gap-2">
                  <FileIcon className="h-4 w-4" />
                  Show just this doc
                </div>
              </SelectItem>
              {hasOutputFiles && (
                <SelectItem value="showOutputs">
                  <div className="flex gap-2">
                    <ArrowRightFromLineIcon className="h-4 w-4" />
                    Show with build outputs
                  </div>
                </SelectItem>
              )}
              {activeBranchOm && (
                <SelectItem value="compareWithMain">
                  <div className="flex gap-2">
                    <ColumnsIcon className="h-4 w-4" />
                    Compare with main
                  </div>
                </SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      {activeBranchOm && (
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() =>
                    changeDocUIState(
                      (state) =>
                        (state.highlightChanges = !state.highlightChanges)
                    )
                  }
                  className={`h-8 px-2 text-xs ${
                    docUIState.highlightChanges
                      ? "shadow-inner shadow-gray-300 border-gray-400 "
                      : "shadow-none"
                  }`}
                >
                  <FileDiffIcon className="h-4 w-4 mr-1" />
                  <span className="whitespace-nowrap text-ellipsis">
                    Highlight changes
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Highlight changes compared to main</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {!docUIState.sidebarMode && (
        <div className="ml-auto mr-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                changeDocUIState((state) => (state.sidebarMode = "review"))
              }
              variant="outline"
              className={`h-8 text-xs ${
                highlightSidebarButton
                  ? "bg-yellow-200 hover:bg-yellow-400"
                  : ""
              }`}
            >
              <MessageSquareIcon size={16} className="mr-2" />
              Review
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const BranchActions: React.FC<{
  activeBranchOm: Om<BranchDoc>;
  branchScopeVersionControlMetadataOm: Om<VersionControlSidecarDoc>;
  setActiveBranchUrl: (branchDocUrl: AutomergeUrl | null) => void;
}> = ({
  activeBranchOm,
  branchScopeVersionControlMetadataOm,
  setActiveBranchUrl,
}) => {
  const handleRenameBranch = useCallback(() => {
    const newName = prompt("Enter the new name for this branch:");
    const newNameTrimmed = newName?.trim();
    if (newNameTrimmed) {
      activeBranchOm.handle.change((d) => {
        d.name = newNameTrimmed;
      });
    }
  }, [activeBranchOm.handle]);

  const handleDeleteBranch = useCallback(() => {
    if (!window.confirm("Are you sure you want to delete this branch?")) {
      return;
    }

    branchScopeVersionControlMetadataOm.handle.change((d) => {
      if (!d.isBranchScope) {
        throw new Error("internal error");
      }
      d.branches = d.branches.filter((b) => b !== activeBranchOm.url);
    });

    setActiveBranchUrl(null);

    toast("Deleted branch");
  }, [
    activeBranchOm.url,
    branchScopeVersionControlMetadataOm?.handle,
    setActiveBranchUrl,
  ]);

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

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger>
        <MoreHorizontal
          size={18}
          className=" text-gray-500 hover:text-gray-800"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-4 w-72">
        <DropdownMenuItem onClick={handleRenameBranch}>
          <Edit3Icon className="inline-block text-gray-500 mr-2" size={14} />{" "}
          Rename branch
        </DropdownMenuItem>
        {/* <DropdownMenuItem
          onClick={() => {
            handleRebaseBranch(branchUrl);
          }}
        >
          <GitBranchPlusIcon
            className="inline-block text-gray-500 mr-2"
            size={14}
          />{" "}
          Incorporate updates from main
        </DropdownMenuItem> */}
        {/* <DropdownMenuItem
          onClick={() => {
            handleMergeBranch(branchUrl);
          }}
        >
          <GitMergeIcon className="inline-block text-gray-500 mr-2" size={14} />{" "}
          Merge branch
        </DropdownMenuItem> */}
        <DropdownMenuItem onClick={handleDeleteBranch}>
          <Trash2Icon className="inline-block text-gray-500 mr-2" size={14} />{" "}
          Delete branch
        </DropdownMenuItem>
        {/* <DropdownMenuSeparator></DropdownMenuSeparator> */}
        {/* {isLLMActive && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Suggested renames:</DropdownMenuLabel>
            {nameSuggestions.length === 0 && (
              <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
            )}
            {nameSuggestions.map((suggestion) => (
              <DropdownMenuItem
                key={suggestion}
                onClick={() => {
                  handleRenameBranch(branchUrl, suggestion);
                }}
              >
                {suggestion}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )} */}
        <DropdownMenuItem
          onClick={() => {
            navigator.clipboard.writeText(activeBranchOm.url).then(
              () => {
                toast("Link copied to clipboard");
              },
              () => {
                toast.error("Failed to copy link to clipboard");
              }
            );
          }}
        >
          <Link className="inline-block text-gray-500 mr-2" size={14} /> Copy
          branch Automerge URL
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
