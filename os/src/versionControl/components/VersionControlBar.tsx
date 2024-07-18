import { useCurrentAccount } from "@/explorer/account";
import { ContactAvatar } from "@/explorer/components/ContactAvatar";
import { selectDocLink } from "@/explorer/hooks/useSelectedDocLink";
import { getRelativeTimeString } from "@/lib/dates";
import { DocPath, FolderDoc } from "@/packages/folder/datatype";
import { ensureMetadataHandleIsBranchScope, useDataTypes } from "@/sdk";
import { Button } from "@/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import _, { truncate } from "lodash";
import {
  CrownIcon,
  GitBranchIcon,
  MessageSquareIcon,
  PlusIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { createJacquardBranch, mergeBranch } from "../branches";
import { BranchScopeAndActiveBranchInfo } from "../hooks";
import { SidebarMode } from "./VersionControlEditor";
import { MergeIcon } from "lucide-react";

// interface MakeBranchOptions {
//   name?: string;
//   heads?: A.Heads;
// }

export const VersionControlBar = ({
  docUrl,
  datatypeId,
  branchScopeAndActiveBranchInfo,
  buildMetadata,
  sidebarMode,
  setSidebarMode,
  showChangesFlag,
  setShowChangesFlag,
  highlightSidebarButton,
  getFakeDocPathForDocUrl,
}: {
  docUrl: AutomergeUrl;
  datatypeId: string;
  branchScopeAndActiveBranchInfo: BranchScopeAndActiveBranchInfo;
  buildMetadata: any;
  sidebarMode: SidebarMode;
  setSidebarMode: (mode: SidebarMode) => void;
  showChangesFlag: boolean;
  setShowChangesFlag: (flag: boolean) => void;
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
    cloneOrMainOm,
  } = branchScopeAndActiveBranchInfo;

  const repo = useRepo();
  const dataTypes = useDataTypes();
  const account = useCurrentAccount();

  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const handleCreateJacquardBranch = useCallback(async () => {
    const docPathForBranchScope = getFakeDocPathForDocUrl(branchScopeOm.url);
    const docLinkForBranchScope = _.last(docPathForBranchScope);

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

  // const handleDeleteBranch = useCallback(
  //   (branchUrl: AutomergeUrl) => {
  //     setSelectedBranch(null);
  //     deleteBranch({ docHandle: handle, branchUrl });
  //     toast("Deleted branch");
  //   },
  //   [handle, setSelectedBranch]
  // );

  const handleMergeBranch = () => {
    mergeBranch({
      repo,
      branchOm: activeBranchOm,
      mergedBy: account?.contactHandle?.url,
    });
    setActiveBranchUrl(null);
    toast.success("Branch merged to main");
  };

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

  // const renameBranch = useCallback(
  //   (draftUrl: AutomergeUrl, newName: string) => {
  //     const docHandle =
  //       repo.find<HasVersionControlMetadata<unknown, unknown>>(docUrl);
  //     docHandle.change((doc) => {
  //       const copy = doc.branchMetadata.branches.find(
  //         (copy) => copy.url === draftUrl
  //       );
  //       if (copy) {
  //         copy.name = newName;
  //         toast(`Renamed branch to "${newName}"`);
  //       }
  //     });
  //   },
  //   [docUrl, repo]
  // );

  return (
    <div className="bg-gray-100 pl-4 py-2 flex gap-2 items-center border-b border-gray-200">
      <div className="flex flex-col gap-1">
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
          <SelectTrigger className="h-8 text-sm w-[18rem] font-medium">
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
          <div className="pl-2 text-xs text-gray-500">
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
      {activeBranchOm && (
        <div className="mr-2">
          <Button
            onClick={(e) => {
              handleMergeBranch();
              e.stopPropagation();
            }}
            variant="outline"
            className="h-6"
          >
            <MergeIcon className="mr-2" size={12} />
            Merge
          </Button>
        </div>
      )}
      <div className="flex items-center ml-4">
        <label htmlFor="debugInfo" className="flex items-center">
          <input
            type="checkbox"
            id="debugInfo"
            checked={showDebugInfo}
            onChange={(e) => setShowDebugInfo(e.target.checked)}
          />
          <span className="ml-2 font-mono text-xs">debug</span>
        </label>
      </div>

      {activeBranchOm && (
        <div className="flex items-center ml-4">
          <label htmlFor="debugInfo" className="flex items-center">
            <input
              type="checkbox"
              id="debugInfo"
              checked={showChangesFlag}
              onChange={(e) => setShowChangesFlag(e.target.checked)}
            />
            <span className="ml-2 font-mono text-xs">highlight changes</span>
          </label>
        </div>
      )}
      {showDebugInfo && (
        <div className="font-mono text-xs flex gap-2 items-center">
          {!isRealBranchScope ? (
            <>
              <div>is not in any branch scope</div>
              <Button
                onClick={() =>
                  ensureMetadataHandleIsBranchScope(
                    branchScopeVersionControlMetadataOm.handle
                  )
                }
                variant="outline"
                className="h-8 text-x"
              >
                make it one
              </Button>
            </>
          ) : branchScopeOm?.url === docUrl ? (
            <> is a branch scope </>
          ) : (
            <>
              <div>is inside a branch scope</div>
              <Button
                onClick={() =>
                  selectDocLink({
                    url: branchScopeOm?.url,
                    name: "fake",
                    type: "folder", // TODO: figure out what to do if we have non folder branch scopes
                  })
                }
                variant="outline"
                className="h-8 text-x"
              >
                go there
              </Button>
            </>
          )}
          <div className="border p-2 rounded">
            <div>clone/self - {cloneOrMainOm.url}</div>
            <div>branch - {activeBranchOm?.url ?? "none"}</div>
          </div>
        </div>
      )}
      {buildMetadata && (
        <div>
          Built:
          <span className="font-mono">{buildMetadata.command}</span> at{" "}
          {new Date(buildMetadata.timestamp).toLocaleString()}
        </div>
      )}
      {!sidebarMode && (
        <div className="ml-auto mr-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSidebarMode("review")}
              variant="outline"
              className={`h-8 text-x ${
                highlightSidebarButton
                  ? "bg-yellow-200 hover:bg-yellow-400"
                  : ""
              }`}
            >
              <MessageSquareIcon size={20} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
