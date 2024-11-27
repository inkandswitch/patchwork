import * as Automerge from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";
import {
  useDocument,
  useHandle,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  GenericChangeGroup,
  TimelineItems,
  groupingByEditTime,
} from "../groupChanges";

import { InlineContactAvatar } from "@/explorer/components/InlineContactAvatar";
import { useSlots } from "@patchwork/sdk/versionControl";
import { Heads } from "@automerge/automerge/next";
import {
  ChevronLeftIcon,
  CrownIcon,
  GitBranchIcon,
  GitBranchPlusIcon,
} from "lucide-react";
import {
  DiffWithProvenance,
  Discussion,
  HasVersionControlMetadata,
  VersionControlSidecarDoc,
} from "../schema";

import { useAutoPopulateChangeGroupSummaries } from "@patchwork/sdk/versionControl";
import { DiscussionInput } from "./DiscussionInput";

import { HasAssets } from "@patchwork/sdk/assets";
import { MarkdownInput } from "@/lib/markdown";
import { type DataType } from "@patchwork/sdk";
import { DocHandle } from "@automerge/automerge-repo";
import {
  BranchScopeAndActiveBranchInfoWithoutDoc,
  ChangeGrouper,
} from "../ChangeGrouper";
import { ChangeGroupingOptions } from "../groupChanges";
import { BranchDoc } from "../schema";
import { BranchScopeAndActiveBranchInfo } from "../signals";

const useScrollToBottom = (doc: unknown) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void doc; // TODO: JAH I think we're supposed to react to this changing?
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [doc]);
  return scrollerRef;
};

/** A position for one side of a changelog selection */
type ChangelogSelectionAnchor = {
  /* The itemId of the anchor */
  itemId: string;

  /* The index of the anchor */
  index: number;

  /* The pixel position of the anchor */
  yPos: number;
};

const useTimelineItems = (
  branchScopeAndActiveBranchInfo: BranchScopeAndActiveBranchInfo,
  options: Omit<
    ChangeGroupingOptions<HasVersionControlMetadata<unknown, unknown>>,
    "markers"
  >
) => {
  const [items, setItems] = useState<
    TimelineItems<HasVersionControlMetadata<unknown, unknown>>[]
  >([]);

  const handle = branchScopeAndActiveBranchInfo.cloneOrMainOm.handle;

  const {
    activeBranchOm,
    baseHeads,
    branchOms,
    branchScopePath,
    branchScopeVersionControlMetadataOm,
    isRealBranchScope,
    originalUrl,
  } = branchScopeAndActiveBranchInfo;

  // BranchScopeAndActiveBranchInfo updates every time the document changes because it contains an Om of the current document
  // We don't want to remount the ChangeGrouper on every key stroke so we create a version of BranchScopeAndActiveBranchInfo with the document
  // The change grouper manually subscribes to changes on the doc through the handle we pass in
  const branchScopeAndActiveBranchInfoWithoutDoc =
    useMemo<BranchScopeAndActiveBranchInfoWithoutDoc>(
      () => ({
        activeBranchOm,
        baseHeads,
        branchOms,
        branchScopePath,
        branchScopeVersionControlMetadataOm,
        isRealBranchScope,
        originalUrl,
      }),
      [
        activeBranchOm,
        baseHeads,
        branchOms,
        branchScopePath,
        branchScopeVersionControlMetadataOm,
        isRealBranchScope,
        originalUrl,
      ]
    );

  useEffect(() => {
    const grouper = new ChangeGrouper(
      handle,
      options,
      branchScopeAndActiveBranchInfoWithoutDoc
    );

    if (grouper.items) {
      setItems(grouper.items);
    }

    const listener = (
      items: TimelineItems<HasVersionControlMetadata<unknown, unknown>>[]
    ) => {
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

export type ChangelogSelection =
  | { from: ChangelogSelectionAnchor; to: ChangelogSelectionAnchor }
  | undefined;

export const TimelineSidebar: React.FC<{
  dataType: DataType;
  docUrl: AutomergeUrl;
  branchScopeAndActiveBranchInfo: BranchScopeAndActiveBranchInfo;
  setDocHeads: (heads: Heads | undefined) => void;
  setDiff: (diff: DiffWithProvenance | undefined) => void;
  onSelectBranchUrl: (branchUrl: AutomergeUrl | null) => void;
}> = ({
  dataType,
  docUrl,
  branchScopeAndActiveBranchInfo,
  setDocHeads,
  setDiff,
  onSelectBranchUrl,
}) => {
  const repo = useRepo();
  const selectedBranchDoc = branchScopeAndActiveBranchInfo.activeBranchOm?.doc;

  const [doc] =
    useDocument<HasVersionControlMetadata<unknown, unknown>>(docUrl);

  const handle =
    useHandle<HasVersionControlMetadata<unknown, unknown>>(docUrl)!; // TODO: JAH strict fix
  const scrollerRef = useScrollToBottom(doc);
  const [showHiddenItems, setShowHiddenItems] = useState(false);

  const {
    includeChangeInHistory,
    includePatchInChangeGroup,
    promptForAIChangeGroupSummary: promptForAutoChangeGroupDescription,
    fallbackSummaryForChangeGroup,
    groupChanges,
  } = dataType ?? {};

  // todo: extract this as an interface that different doc types can implement
  const changeGroupingOptions = useMemo<
    Omit<
      ChangeGroupingOptions<HasVersionControlMetadata<unknown, unknown>>,
      "markers"
    >
  >(
    () => ({
      grouping: groupChanges ?? groupingByEditTime(30),
      includeChangeInHistory,
      includePatchInChangeGroup,
      fallbackSummaryForChangeGroup,
    }),
    [
      groupChanges,
      includeChangeInHistory,
      includePatchInChangeGroup,
      fallbackSummaryForChangeGroup,
    ]
  );

  const changelogItems = useTimelineItems(
    branchScopeAndActiveBranchInfo,
    changeGroupingOptions
  );

  const hiddenItemBoundary = changelogItems.findIndex(
    (item) => item.type === "originOfThisBranch" && item.hideHistoryBeforeThis
  );

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

  const { selection, handleClick, clearSelection, itemsContainerRef } =
    useChangelogSelection({
      items: changelogItems ?? [],
      setDiff,
      setDocHeads,
    });

  const changeGroups = useMemo(() => {
    return changelogItems.flatMap((item) => {
      if (item.type === "changeGroup") {
        return [item.changeGroup];
      } else if (item.type === "otherBranchMergedIntoThisDoc") {
        return item.changeGroups;
      } else {
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

  if (!doc) return null;

  return (
    <div className="h-full w-full flex flex-col text-xs text-gray-600">
      {/* Show which branch we're on  */}
      <div className="bg-gray-50 border-gray-200 border-b">
        <div className="flex items-center">
          <div
            className="cursor-pointer text-gray-500 font-semibold underline w-12 flex-shrink-0"
            onClick={() => {
              onSelectBranchUrl(null);
            }}
          >
            {selectedBranchDoc && (
              <>
                <ChevronLeftIcon size={12} className="inline" />
                Main
              </>
            )}
          </div>
          <div className="flex-grow flex justify-center items-center px-2 py-1 text-sm">
            <div className="font-medium text-gray-800">
              {!selectedBranchDoc && (
                <div className="flex items-center gap-2">
                  <CrownIcon className="inline" size={12} />
                  Main
                </div>
              )}
              {selectedBranchDoc && (
                <div className="flex items-center gap-2">
                  <GitBranchIcon className="inline" size={12} />
                  {selectedBranchDoc.name}
                </div>
              )}
            </div>
          </div>
          <div className="w-12 flex-shrink-0"></div>
        </div>
        {selection && (
          <div className="absolute flex gap-2 p-2 bg-gray-100 z-10 w-full border-b border-t border-gray-300">
            <div className="text-blue-600 font-medium">
              Showing {selection.to.index - selection.from.index + 1} change
              {selection.to.index === selection.from.index ? "" : "s"}
            </div>
            <div
              className="cursor-pointer text-gray-500 font-semibold underline"
              onClick={clearSelection}
            >
              Reset to now
            </div>
          </div>
        )}
      </div>

      {/* The timeline */}
      <div
        className="bg-gray-100 overflow-auto flex-1 flex flex-col pb-4 relative"
        ref={scrollerRef}
      >
        <div className="timeline-line"></div>
        <div className="relative mt-auto flex flex-col" ref={itemsContainerRef}>
          {/* Show a toggle for hidden items */}
          <div className="pl-6 text-xs  text-gray-500">
            {!showHiddenItems && hiddenItemBoundary > 0 && (
              <div className="flex gap-2">
                <div>{hiddenItemBoundary + 1} items before branch creation</div>
                <div
                  className="font-semibold cursor-pointer underline"
                  onClick={() => setShowHiddenItems(true)}
                >
                  show
                </div>
              </div>
            )}
          </div>

          {visibleItems.map((item, index) => {
            const selected =
              (selection &&
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
            const dateChangedFromPrevItem =
              prevItemDateTime !== currentItemDateTime;

            return (
              <>
                {dateChangedFromPrevItem && (
                  <div className="text-xs text-gray-400">
                    <DateHeader timestamp={item.time} />
                  </div>
                )}
                <div
                  key={item.id}
                  data-item-id={item.id}
                  className={`p-2 cursor-default select-none w-full flex items-start gap-2 ${
                    selected ? "bg-blue-100 bg-opacity-20" : ""
                  }`}
                  onClick={(e) =>
                    handleClick({
                      itemId: item.id,
                      shiftPressed: e.shiftKey,
                    })
                  }
                >
                  {(() => {
                    switch (item.type) {
                      case "changeGroup":
                        return (
                          <ChangeGroupItem
                            group={item.changeGroup}
                            doc={doc}
                            selected={selected}
                          />
                        );
                      case "branchCreatedFromThisDoc":
                        return (
                          <BranchCreatedItem
                            branch={item.branchOm.doc}
                            selected={selected}
                          />
                        );
                      case "discussionThread":
                        return (
                          <DiscussionThreadItem
                            discussion={item.discussion}
                            docWithAssetsHandle={handle}
                            selected={selected}
                          />
                        );
                      case "originOfThisBranch":
                        return (
                          <BranchOriginItem
                            branch={item.branchOm.doc}
                            selected={selected}
                          />
                        );
                      case "otherBranchMergedIntoThisDoc":
                        return (
                          <BranchMergedItem
                            doc={doc}
                            branch={item.branchOm.doc}
                            selected={selected}
                            changeGroups={item.changeGroups}
                          />
                        );
                      default: {
                        // Ensure we've handled all types, if an
                        const exhaustiveCheck: never = item;
                        return exhaustiveCheck;
                      }
                    }
                  })()}

                  {/* User avatars associated with this item */}
                  {item.type !== "discussionThread" && (
                    <div className="ml-auto flex-shrink-0 flex items-center gap-2">
                      <div className="flex items-center space-x-[-4px]">
                        {item.users.map((contactUrl) => (
                          <div className="rounded-full" key={contactUrl}>
                            <InlineContactAvatar
                              key={contactUrl}
                              url={contactUrl}
                              size="sm"
                              showName={false}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Context menu for the item (TODO: how to populate actions for this?) */}
                      <div className="mt-1 -mx-1">
                        {/* <DropdownMenu>
                          <DropdownMenuTrigger>
                            <MoreVerticalIcon
                              size={18}
                              className="text-gray-300 hover:text-gray-800"
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="mr-4">
                            {(item.type === "otherBranchMergedIntoThisDoc" ||
                              item.type === "branchCreatedFromThisDoc") && (
                              <DropdownMenuItem
                                onClick={() => setSelectedBranch(item.branch)}
                              >
                                Go to branch
                              </DropdownMenuItem>
                            )}

                            {item.type === "changeGroup" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  const summary = window.prompt(
                                    "New summary:",
                                    doc.changeGroupSummaries[
                                      item.changeGroup.id
                                    ]?.title ?? ""
                                  );
                                  if (summary) {
                                    handle.change((doc) => {
                                      doc.changeGroupSummaries[
                                        item.changeGroup.id
                                      ] = {
                                        title: summary,
                                      };
                                    });
                                  }
                                }}
                              >
                                <PencilIcon size={12} className="mr-1 inline" />
                                Edit summary
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu> */}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })}

          {/* Blue selection box overlay */}
          {selection && (
            <div
              className="absolute left-1 right-1 border-2 border-blue-600 rounded-lg transition-all duration-200 pointer-events-none"
              style={{
                top: selection.from.yPos,
                height: selection.to.yPos - selection.from.yPos,
              }}
            ></div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 z-10">
        <DiscussionInput
          doc={doc}
          handle={handle}
          changelogItems={changelogItems}
          changelogSelection={selection}
        />
      </div>
    </div>
  );
};

// Manage the selection state for changelog items.
// Supports multi-select interaction.
// Returns pixel coordinates for the selection to help w/ drawing a selection box.
const useChangelogSelection = function <T>({
  items,
  setDiff,
  setDocHeads,
}: {
  items: TimelineItems<T>[];
  setDiff: (diff: DiffWithProvenance | undefined) => void;
  setDocHeads: (heads: Heads | undefined) => void;
}): {
  // The current selection
  selection: ChangelogSelection;
  // Click handler for the items
  handleClick: ({
    itemId,
    shiftPressed,
  }: {
    itemId: string;
    shiftPressed: boolean;
  }) => void;
  // Ref for the container of the items
  itemsContainerRef: React.RefObject<HTMLDivElement>;
  // Callback to clear the selection
  clearSelection: () => void;
} {
  // Internally we track selection using item IDs.
  // Once we return it out of the hook, we'll also tack on numbers, to help out in the view.
  const [selection, setSelection] = useState<
    { from: string; to: string } | undefined
  >(undefined);

  // sync the diff and docHeads up to the parent component when the selection changes
  useEffect(() => {
    if (!selection) {
      setDiff(undefined);
      setDocHeads(undefined);
    }

    const fromItemIndex = items.findIndex(
      (item) => item.id === selection?.from
    );
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
        } else if (item.type === "otherBranchMergedIntoThisDoc") {
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

  const itemsContainerRef = useRef<HTMLDivElement>(null);

  const handleClick = ({
    itemId,
    shiftPressed,
  }: {
    itemId: string;
    shiftPressed: boolean;
  }) => {
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
    } else {
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
  ] as HTMLElement[];

  const fromElement = containerChildren.find(
    (div) => div.dataset.itemId === selection.from
  );

  const toElement = containerChildren.find(
    (div) => div.dataset.itemId === selection.to
  );

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

const ChangeGroupItem: React.FC<{
  group: GenericChangeGroup;
  doc: HasVersionControlMetadata<unknown, unknown>;
  selected: boolean;
}> = ({ group, doc }) => {
  return (
    <div className="pl-[7px] pr-1 flex w-full">
      <div className="flex-shrink-0 w-3 h-3 border-b-2 border-l-2 border-gray-300 rounded-bl-full"></div>
      <ChangeGroupDescription changeGroup={group} doc={doc} />
    </div>
  );
};

const DateHeader: React.FC<{ timestamp?: number }> = ({ timestamp }) => {
  return (
    <div className="text-sm font-normal text-gray-300 px-4 flex items-center justify-between p-1 w-full">
      <hr className="flex-grow border-t border-gray-200 mr-2 ml-4" />
      <div>
        {timestamp
          ? new Date(timestamp).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              weekday: "long",
            })
          : "Date unknown"}
      </div>
    </div>
  );
};

// Summary of a change group: textual + avatars
const ChangeGroupDescription = ({
  changeGroup,
  doc,
}: {
  changeGroup: GenericChangeGroup;
  doc: Automerge.Doc<HasVersionControlMetadata>;
}) => {
  const [versionControlSidecarDoc] = useDocument<VersionControlSidecarDoc>(
    doc.versionControlMetadataUrl
  );

  let summary;
  if (
    !versionControlSidecarDoc ||
    !versionControlSidecarDoc.changeGroupSummaries ||
    !versionControlSidecarDoc.changeGroupSummaries[changeGroup.id]
  ) {
    summary = changeGroup.fallbackSummary;
  } else {
    summary =
      versionControlSidecarDoc.changeGroupSummaries[changeGroup.id].title;
  }
  return (
    <div className={`group  p-1 rounded-full font-medium text-xs flex`}>
      <div className="mr-2 text-gray-500">{summary}</div>
    </div>
  );
};

const BranchMergedItem: React.FC<{
  doc: Automerge.Doc<HasVersionControlMetadata>;
  branch: BranchDoc;
  changeGroups: GenericChangeGroup[];
  selected: boolean;
}> = ({ doc, branch, changeGroups, selected }) => {
  return (
    <ItemView selected={selected} color="purple">
      <ItemActionMessage>branch merged</ItemActionMessage>
      <ItemIcon>
        <GitBranchPlusIcon
          className="h-[10px] w-[10px] text-white"
          strokeWidth={2}
        />
      </ItemIcon>

      <ItemContent>
        <div className="text-sm flex flex-col gap-1 select-none">
          <div>
            <div className="inline font-semibold">{branch.name}</div>{" "}
          </div>
          {changeGroups.map((group) => (
            <div className="flex" key={group.id}>
              <ChangeGroupDescription changeGroup={group} doc={doc} />
              <div className="flex flex-shrink-0 items-start space-x-[-4px]">
                {group.authorUrls.map((contactUrl) => (
                  <div className="rounded-full" key={contactUrl}>
                    <InlineContactAvatar
                      key={contactUrl}
                      url={contactUrl}
                      size="sm"
                      showName={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ItemContent>
    </ItemView>
  );
};

const BranchCreatedItem = ({
  branch,
  selected,
}: {
  branch: BranchDoc;
  selected: boolean;
}) => {
  return (
    <ItemView selected={selected} color="neutral">
      <ItemActionMessage>branch created</ItemActionMessage>
      <ItemIcon>
        <GitBranchIcon className="h-[10px] w-[10px] text-neutral-600" />
      </ItemIcon>
      <ItemContent>
        <div>
          <div className="text-sm flex select-none items-center">
            <div className="mb-1">
              <div className="inline font-semibold">{branch.name}</div>{" "}
            </div>
          </div>
        </div>
      </ItemContent>
    </ItemView>
  );
};

const BranchOriginItem = ({
  branch,
  selected,
}: {
  branch: BranchDoc;
  selected: boolean;
}) => {
  return (
    <ItemView selected={selected} color="green">
      <ItemActionMessage>this branch started</ItemActionMessage>
      <ItemIcon>
        <GitBranchIcon className="h-[10px] w-[10px] text-white" />
      </ItemIcon>
      <ItemContent>
        <div>
          <div className="text-sm flex select-none items-center">
            <div className="mb-1">
              <div className="inline font-semibold">{branch.name}</div>{" "}
            </div>
          </div>
        </div>
      </ItemContent>
    </ItemView>
  );
};

// Show a discussion thread about the document.
// We only show discussions about the whole doc in this timeline view,
// not discussions about specific parts of the doc.
// We only show the first comment in the thread (replying isn't supported yet)
const DiscussionThreadItem = ({
  discussion,
  docWithAssetsHandle,
}: {
  docWithAssetsHandle: DocHandle<HasAssets>;
  discussion: Discussion<unknown>;
  selected: boolean;
}) => {
  const comment = discussion.comments[0];
  return (
    <div className="ml-6 mr-16 my-0 w-full min-h-12 flex gap-1 bg-yellow-50 border-yellow-100 text-xs p-2 shadow-md select-none">
      <div className="flex-shrink-0">
        <InlineContactAvatar
          size="default"
          url={comment.contactUrl}
          showName={false}
        />
      </div>
      <div className="font-normal text-gray-800 -ml-1 -my-1">
        <MarkdownInput
          value={comment.content.trim()}
          docWithAssetsHandle={docWithAssetsHandle}
        />
      </div>
    </div>
  );
};

const ItemIcon = ({ children }: { children: ReactNode }) => <>{children}</>;
const ItemContent = ({ children }: { children: ReactNode }) => <>{children}</>;
const ItemActionMessage = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);

const ItemView = ({
  children,
  color = "neutral",
}: {
  selected: boolean;
  children: ReactNode | ReactNode[];
  color: string;
}) => {
  const [slots] = useSlots(children, {
    icon: ItemIcon,
    content: ItemContent,
    actionMessage: ItemActionMessage,
  });

  const tailwindColor =
    {
      purple: "bg-purple-600",
      green: "bg-green-600",
      neutral: "bg-neutral-300",
      orange: "bg-amber-600",
    }[color] ?? "bg-neutral-600";

  return (
    <div className="items-top flex gap-1 w-full pr-4">
      {slots.icon && (
        <div
          className={`${tailwindColor} mt-1.5 flex h-[16px] w-[16px] items-center justify-center rounded-full  outline outline-2 outline-gray-100`}
        >
          {slots.icon}
        </div>
      )}

      {!slots.icon && <div className="w-[16px] h-[16px] mt-1.5" />}
      <div className="flex-1 flex-grow px-1">
        {slots.actionMessage && (
          <div className="my-1 font-medium text-gray-500">
            {slots.actionMessage}
          </div>
        )}
        <div className={`bg-white flex-1 rounded py-1 px-2 shadow`}>
          {slots.content}
        </div>
      </div>
    </div>
  );
};
