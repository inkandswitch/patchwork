// This file puts changes from a doc into groups for display in the UI.
// There are various algorithms that can govern what makes a group.
// It can accept manual markers to split groups.

// It also calculates some stats for each group, both generic to all docs
// as well as calling out to some datatype-specific summarization.

// Known issues:
// - getAllChanges returns different orders on different devices;
//   we should define a total order for changes across all devices.

import * as Automerge from "@automerge/automerge";
import {
  AutomergeUrl,
  DocHandle,
  encodeHeads,
} from "@automerge/automerge-repo";
import {
  ActorId,
  DecodedChange,
  Doc,
  Patch,
  getHeads,
  view,
} from "@automerge/automerge";
import { isEqual, sortBy } from "lodash";
import { ReactElement } from "react";
import { getChangesFromMergedBranch } from "./branches";

import { Om } from "../om";
import { BranchScopeAndActiveBranchInfoWithoutDoc } from "./ChangeGrouper";
import {
  BranchDoc,
  DiffWithProvenance,
  Discussion,
  HasVersionControlMetadata,
  MergedBranchDoc,
} from "./schema";
import { TextPatch, diffWithProvenance } from "./utils";

type Hash = string;

/** Change group attributes that could work for any document */

export type PendingChangeGroup<T> = {
  // Uniquely IDs the changes in this group.
  // (Concretely, we make IDs from heads + to heads, which I think does stably ID changes?)
  id: string;
  from: Hash;
  to: Hash;
  changes: DecodedChangeWithMetadata[];
  actorIds: ActorId[];
  authorUrls: AutomergeUrl[];
  time?: number;
  markers: HeadsMarker<T>[];
};

export type ChangeGroup<T> = PendingChangeGroup<T> & {
  docAtEndOfChangeGroup: Doc<T>;

  diff: DiffWithProvenance;

  numberOfEdits: number;

  /** A simple summary of the contents of this change group, computed cheaply at grouping time
   *  based on the contents of the change group.
   *  This is used as a fallback when we don't have a manual summary provided by the user or AI.
   *  NOTE: user-provided summaries are persisted elsewhere, this fallback is just computed
   *  on the fly!
   */
  fallbackSummary: string | ReactElement;
};

export type GenericChangeGroup = ChangeGroup<unknown>;

export interface DecodedChangeWithMetadata extends DecodedChange {
  metadata: Record<string, any>;
}

/** A marker of a moment in the doc history associated w/ some heads */

export type HeadsMarkerBase = {
  id: string;
  heads: Automerge.Heads;
  users: AutomergeUrl[];
  hideHistoryBeforeThis?: boolean;
};

export type OtherBranchMergedMarker<T> = {
  type: "otherBranchMergedIntoThisDoc";
  branchOm: Om<MergedBranchDoc>;
  changeGroups: ChangeGroup<T>[];
} & HeadsMarkerBase;

export type BranchCreatedMarker = {
  type: "branchCreatedFromThisDoc";
  branchOm: Om<BranchDoc>;
} & HeadsMarkerBase;

export type OriginBranchMarker = {
  type: "originOfThisBranch";
  source: { docUrl: AutomergeUrl; heads: Automerge.Heads };
  branchOm: Om<BranchDoc>;
} & HeadsMarkerBase;

export type DiscussionThreadMarker = {
  type: "discussionThread";
  discussion: Discussion<unknown>;
} & HeadsMarkerBase;

export type HeadsMarker<T> =
  | OtherBranchMergedMarker<T>
  | BranchCreatedMarker
  | OriginBranchMarker
  | DiscussionThreadMarker;

// All ChangelogItems have a unique id, a heads, and some users asociated.
// Then, each type of item has its own unique data associated too.
export type TimelineItems<T> = {
  id: string;
  heads: Automerge.Heads;
  users: AutomergeUrl[];
  time?: number;
} & ({ type: "changeGroup"; changeGroup: ChangeGroup<T> } | HeadsMarker<T>);

type GroupingAlgorithm<T> = (
  currentGroup: PendingChangeGroup<T>,
  newChange: DecodedChangeWithMetadata
) => boolean;

const defaultPopulateFallbackSummary = <D>(changeGroup: ChangeGroup<D>) => {
  const { numberOfEdits } = changeGroup;
  return `${numberOfEdits} edit${numberOfEdits === 1 ? "" : "s"}`;
};

export const groupingByActorAndNumChanges =
  <T>(batchSize: number) =>
  (
    currentGroup: PendingChangeGroup<T>,
    newChange: DecodedChangeWithMetadata
  ) => {
    return (
      currentGroup.actorIds[0] === newChange.actor &&
      currentGroup.changes.length < batchSize
    );
  };

export const groupingByActor = <T>(
  currentGroup: PendingChangeGroup<T>,
  newChange: DecodedChangeWithMetadata
) => {
  return currentGroup.actorIds[0] === newChange.actor;
};

export const groupingByAuthor = <T>(
  currentGroup: PendingChangeGroup<T>,
  newChange: DecodedChangeWithMetadata
) => {
  if (!newChange.metadata?.author) {
    return true;
  }
  return currentGroup.authorUrls.includes(
    newChange.metadata?.author as AutomergeUrl
  );
};

export const groupingByNumberOfChanges =
  <T>(batchSize: number) =>
  (currentGroup: PendingChangeGroup<T>) => {
    return currentGroup.changes.length < batchSize;
  };

// This always combines everything into one group,
// so we only end up splitting when there's a manual tag
export const groupingByTagsOnly = () => true;

// "batch size" param here means "max gap allowed, in ms"
//
export const groupingByEditTime =
  <T>(maxGapInMinutes: number) =>
  (
    currentGroup: PendingChangeGroup<T>,
    newChange: DecodedChangeWithMetadata
  ) => {
    if (
      (newChange.time === undefined || currentGroup.time === 0) &&
      (currentGroup.time === undefined || currentGroup.time === 0)
    ) {
      return true;
    }

    if (currentGroup.time === undefined) {
      return false;
    }

    return newChange.time < currentGroup.time + maxGapInMinutes * 60 * 1000;
  };

export const noGrouping = () => false;

export const groupingByAuthorOrTime =
  <T>(maxGapInMinutes: number) =>
  (currentGroup: ChangeGroup<T>, newChange: DecodedChangeWithMetadata) => {
    const authorMatch =
      !newChange.metadata?.author ||
      currentGroup.authorUrls.includes(
        newChange.metadata?.author as AutomergeUrl
      );
    const timeMatch =
      newChange.time === undefined ||
      newChange.time === 0 ||
      currentGroup.time === undefined ||
      currentGroup.time === 0 ||
      newChange.time < currentGroup.time + maxGapInMinutes * 60 * 1000;
    return authorMatch && timeMatch;
  };

// Other groupings to try:
// - time based sessions
// - use a manual grouping persisted somewhere?
// - nonlinear: group by actor, out of this sorted order of changes

export const getMarkersForDoc = <T extends HasVersionControlMetadata>(
  handle: DocHandle<T>,
  branchScopeAndActiveBranchInfo: BranchScopeAndActiveBranchInfoWithoutDoc
): HeadsMarker<T>[] => {
  const doc = handle.doc();

  if (!doc) return [];
  let markers: HeadsMarker<T>[] = [];

  const discussions: DiscussionThreadMarker[] = Object.values(
    doc.discussions ?? {}
  )
    .filter((d) => !d.anchors || d.anchors.length === 0)
    .map((discussion) => ({
      type: "discussionThread" as const,
      id: `discussion-${discussion.id}`,
      heads: discussion.heads,
      users: discussion.comments
        .map((comment) => comment.contactUrl)
        .filter((contactUrl): contactUrl is AutomergeUrl => !!contactUrl),
      discussion,
    }));

  // Sorting by timestamp is a bit bad and not-local-firsty...
  // The problem is that we don't currently store an ordering on
  // discussions, and so we have on way to order discussions at
  // the same heads other than a timestamp.
  // A better solution would be to store an array in Automerge.
  const sortedDiscussions = sortBy(
    discussions,
    (d) => d.discussion.comments[0].timestamp ?? 0
  );

  /** Mark discussion threads */
  markers = markers.concat(sortedDiscussions);

  /** Mark branch merge points */
  const otherBranchMergedMarkers: OtherBranchMergedMarker<T>[] =
    !branchScopeAndActiveBranchInfo.activeBranchOm
      ? branchScopeAndActiveBranchInfo.branchOms
          .filter((om): om is Om<MergedBranchDoc> => {
            const { doc } = om;

            if (
              !doc.mergeMetadata ||
              !doc.mergeMetadata.mergeHeadsByDocUrl // ignore old merges that don't have merged heads yet
            ) {
              return false;
            }

            const cloneOnBranch =
              doc.clones[branchScopeAndActiveBranchInfo.originalUrl];
            return cloneOnBranch !== undefined;
          })
          .map((om): OtherBranchMergedMarker<T> => {
            const { doc } = om;
            return {
              id: `branch-merge-${doc.clones[handle.url].url}`,
              heads: doc.mergeMetadata!.mergeHeadsByDocUrl[handle.url],
              type: "otherBranchMergedIntoThisDoc",
              users: doc.mergeMetadata!.mergedBy
                ? [doc.mergeMetadata!.mergedBy]
                : [],
              branchOm: om,
              changeGroups: [],
            };
          })
      : [];

  markers = markers.concat(otherBranchMergedMarkers);

  /** Mark where this branch started */
  const activeBranchOm = branchScopeAndActiveBranchInfo.activeBranchOm;
  if (activeBranchOm) {
    const branchDoc = activeBranchOm.doc;

    markers.push({
      id: `origin-of-this-branch`,
      heads: branchScopeAndActiveBranchInfo.baseHeads,
      users: branchDoc.createdBy ? [branchDoc.createdBy] : [],
      type: "originOfThisBranch",
      source: {
        docUrl: branchScopeAndActiveBranchInfo.originalUrl,
        heads: branchScopeAndActiveBranchInfo.baseHeads,
      },
      branchOm: activeBranchOm,
      hideHistoryBeforeThis: true,
    });
  }

  /** Mark new branches off this one */
  const branchCreatedMarkers: HeadsMarker<T>[] =
    !branchScopeAndActiveBranchInfo.activeBranchOm
      ? branchScopeAndActiveBranchInfo.branchOms
          .filter(({ doc }) => {
            const cloneOnBranch = doc.clones[handle.url];
            return cloneOnBranch !== undefined;
          })
          .map((branchOm) => {
            const { doc, url } = branchOm;

            return {
              id: `branch-created-${url}`,
              users: doc.createdBy ? [doc.createdBy] : [],
              heads: doc.clones[handle.url].baseHeads,
              type: "branchCreatedFromThisDoc",
              branchOm,
            };
          })
      : [];

  markers = markers.concat(branchCreatedMarkers);

  return markers;
};

export type ChangeGroupingOptions<D> = {
  /** The algorithm used to group changes (picking from presets defined in GROUPINGS) */
  grouping: GroupingAlgorithm<D>;

  /** Markers to display at certain heads in the history */
  markers: HeadsMarker<D>[];

  /** Conditon to keep only certain changes */
  includeChangeInHistory?: (
    doc: D
  ) => (decodedChange: DecodedChangeWithMetadata) => boolean;

  /** Condition to keep only certain patches in the change group
   * the number of kept patches is assigned as numberOfEdits
   */
  includePatchInChangeGroup?: (patch: Patch | TextPatch) => boolean; // todo: can we not leak TextPatch to all datatypes?

  fallbackSummaryForChangeGroup?: (
    changeGroup: ChangeGroup<D>
  ) => string | ReactElement;
};

/** A memoized record of some change groups, including a record of what options were used. */
export type MemoizedChangeGroups<D> = {
  changeGroups: ChangeGroup<D>[];
  changeCount: number;
  options: ChangeGroupingOptions<D>;
};

/** Returns a flat list of timeline items for display in the UI,
 *  based on a list of change groups.
 */
export const getTimelineItems = <D extends HasVersionControlMetadata>({
  doc,
  mainUrl,
  changes,
  options,
  memoizedGroups,
}: {
  doc: Doc<D>;
  mainUrl: AutomergeUrl;
  changes: DecodedChangeWithMetadata[];
  options: ChangeGroupingOptions<D>;
  memoizedGroups?: MemoizedChangeGroups<D>;
}): {
  items: TimelineItems<D>[];
  memoizedGroups: MemoizedChangeGroups<D>;
} => {
  const { changeGroups, changeCount } = getGroupedChangesMemo({
    doc,
    mainUrl,
    changes,
    options,
    memoizedGroups,
  });

  const timelineItems: TimelineItems<D>[] = [];
  for (const changeGroup of changeGroups) {
    // If this is a branch merge, we treat it in a special way --
    // we don't directly put the change group in as an item;
    // we nest it inside the merge marker.
    const mergeMarker = changeGroup.markers.find(
      (m) => m.type === "otherBranchMergedIntoThisDoc"
    );
    if (mergeMarker) {
      const otherMarkersForThisGroup = changeGroup.markers.filter(
        (m) => m !== mergeMarker
      );
      timelineItems.push({ ...mergeMarker, time: changeGroup.time });
      for (const marker of otherMarkersForThisGroup) {
        timelineItems.push({ ...marker, time: changeGroup.time });
      }
    } else {
      // for normal change groups, push the group (if it contains edits)
      if (changeGroup.numberOfEdits > 0) {
        timelineItems.push({
          id: `changeGroup-${changeGroup.from}-${changeGroup.to}`,
          type: "changeGroup",
          changeGroup,
          users: changeGroup.authorUrls,
          heads: [changeGroup.to],
          time: changeGroup.time,
        });
      }

      // ... and then any markers
      for (const marker of changeGroup.markers) {
        timelineItems.push({ ...marker, time: changeGroup.time });
      }
    }
  }
  return {
    items: timelineItems,
    memoizedGroups: {
      changeGroups,
      changeCount,
      options,
    },
  };
};

// Fill in aggregate details on a change group
const finalizeChangeGroup = <D>({
  group,
  doc,
  diffHeads,
  options: { includePatchInChangeGroup, fallbackSummaryForChangeGroup },
}: {
  group: PendingChangeGroup<D>;
  doc: Doc<D>;
  diffHeads: Automerge.Heads;
  options: ChangeGroupingOptions<D>;
}): ChangeGroup<D> | null => {
  const diff = diffWithProvenance(doc, diffHeads, [group.to]);
  const filteredDiff = {
    ...diff,
    patches: diff.patches.filter(
      (patch) => !includePatchInChangeGroup || includePatchInChangeGroup(patch)
    ),
  };

  const numberOfEdits = filteredDiff.patches.length;

  if (numberOfEdits === 0 && group.markers.length === 0) {
    return null;
  }

  const finalized: ChangeGroup<D> = {
    ...group,
    id: `${group.from}-${group.to}`,
    diff: filteredDiff,
    numberOfEdits,
    docAtEndOfChangeGroup: view(doc, [group.to]),
    fallbackSummary: "",
  };

  finalized.fallbackSummary = fallbackSummaryForChangeGroup
    ? fallbackSummaryForChangeGroup(finalized)
    : defaultPopulateFallbackSummary(finalized);

  return finalized;
};

// Given previous cached results for change grouping, returns new groupings
// either by incrementally adding to the memoized result or by restarting from scratch.
const getGroupedChangesMemo = <T>({
  doc,
  mainUrl,
  changes,
  options,
  memoizedGroups,
}: {
  doc: Doc<T>;
  mainUrl: AutomergeUrl;
  changes: DecodedChangeWithMetadata[];
  options: ChangeGroupingOptions<T>;
  memoizedGroups?: MemoizedChangeGroups<T>;
}) => {
  if (!memoizedGroups || !isEqual(options, memoizedGroups.options)) {
    // recompute from scratch
    return getGroupedChanges({
      doc,
      mainUrl,
      changes,
      options,
    });
  }

  const includeChangeInHistoryForThisDoc = options.includeChangeInHistory
    ? options.includeChangeInHistory(doc)
    : () => true;

  const newChanges = changes
    .slice(memoizedGroups.changeCount)
    .filter(includeChangeInHistoryForThisDoc);

  // incrementally update the previous groups
  const lastGroup =
    memoizedGroups.changeGroups[memoizedGroups.changeGroups.length - 1];
  let revisedLastGroup = { ...lastGroup };

  // Check that all the new changes belong to the last group.
  for (const change of newChanges) {
    if (!options.grouping(revisedLastGroup, change)) {
      // Bail out and recompute from scratch
      return getGroupedChanges({
        doc,
        mainUrl,
        changes,
        options,
      });
    } else {
      revisedLastGroup = addChangeToGroup({ group: revisedLastGroup, change });
    }
  }

  const finalizedLastGroup = finalizeChangeGroup({
    group: revisedLastGroup,
    diffHeads:
      memoizedGroups.changeGroups.length > 1
        ? [
            memoizedGroups.changeGroups[memoizedGroups.changeGroups.length - 2]
              .to,
          ]
        : [],
    doc,
    options,
  });

  if (finalizedLastGroup === null) {
    return memoizedGroups;
  }

  const newGroups = [
    ...memoizedGroups.changeGroups.slice(0, -1),
    finalizedLastGroup,
  ];
  return {
    changeGroups: newGroups,
    changeCount: changes.length,
  };
};

// Add a change to an existing group, and maintain stats for the
// group that need to be updated as we go.
// Returns a new group without mutating the one passed in.
const addChangeToGroup = <D, C extends ChangeGroup<D> | PendingChangeGroup<D>>({
  group: originalGroup,
  change,
}: {
  group: C;
  change: DecodedChangeWithMetadata;
}): C => {
  const group = { ...originalGroup };
  group.changes.push(change);
  group.to = change.hash;
  if (change.time && change.time > 0) {
    group.time = change.time;
  }
  if (!group.actorIds.includes(change.actor)) {
    group.actorIds.push(change.actor);
  }
  if (
    change.metadata?.author &&
    !group.authorUrls.includes(change.metadata.author as AutomergeUrl)
  ) {
    group.authorUrls.push(change.metadata.author as AutomergeUrl);
  }

  return group;
};

/** Returns a list of change groups using the specified algorithm.
 *  Markers for specific moments in the history can be passed in;
 *  these automatically split the groups at the marker.
 *  The structure returned by this function is a list of change groups
 *  with markers attached; if you want a flat list of changelog items
 *  for display, use getChangelogItems.
 */
export const getGroupedChanges = <T>({
  doc,
  mainUrl,
  changes,
  options: {
    grouping,
    markers,
    includeChangeInHistory,
    includePatchInChangeGroup,
    fallbackSummaryForChangeGroup,
  },
}: {
  doc: Doc<T>;
  mainUrl: AutomergeUrl;
  changes: DecodedChangeWithMetadata[];
  options: ChangeGroupingOptions<T>;
}) => {
  // TODO: we should sort this list in a stable way across devices.
  const changeGroups: ChangeGroup<T>[] = [];

  let currentGroup: PendingChangeGroup<T> | null = null;

  // define a helper for pushing a new group onto the list
  const pushGroup = (group: PendingChangeGroup<T>) => {
    const finalized = finalizeChangeGroup({
      group,
      doc,
      diffHeads:
        changeGroups.length > 0
          ? [changeGroups[changeGroups.length - 1].to]
          : [],
      options: {
        grouping,
        markers,
        includeChangeInHistory,
        includePatchInChangeGroup,
        fallbackSummaryForChangeGroup,
      },
    });

    if (finalized) {
      changeGroups.push(finalized);
    }
  };

  // for each merged branch in the doc, we need to start a change group for that branch.
  // anytime we hit a change claimed by a merged branch, it's not considered in the regular
  // grouping logic, it's instead added to the single group for that branch.
  // then we add the branch's change group to the list once we hit its merge point.

  const branchChangeGroups: {
    [key: string]: {
      changeGroup: ChangeGroup<T>;
      changeHashes: Set<Hash>;
      mergeMetadata: {
        mergedAt: number;
        mergedBy: AutomergeUrl;
        mergeHeads: Automerge.Heads;
      };
    };
  } = {};

  const branchMergedMarkers = markers.filter(
    (marker) => marker.type === "otherBranchMergedIntoThisDoc"
  );

  for (const marker of branchMergedMarkers) {
    const branchDoc = marker.branchOm.doc;
    const branchUrl = marker.branchOm.url;
    const baseHeads = branchDoc.clones[mainUrl]?.baseHeads;

    // ignore branches that don't contain the current file
    if (!baseHeads) {
      continue;
    }

    const { mergeHeadsByDocUrl, mergedAt, mergedBy } = branchDoc.mergeMetadata;

    const mergeHeads = mergeHeadsByDocUrl[mainUrl];

    branchChangeGroups[branchUrl] = {
      changeGroup: {
        id: `${baseHeads}-${mergeHeads}`,
        from: baseHeads[0],
        to: mergeHeads[0],
        changes: [],
        actorIds: [],
        authorUrls: [],
        docAtEndOfChangeGroup: Automerge.view(doc, mergeHeads),
        diff: { patches: [], fromHeads: [], toHeads: [] },
        markers: [],
        numberOfEdits: 0,
        time: undefined,
        fallbackSummary: "", // We'll fill this in when we finalize the group
      },
      changeHashes: getChangesFromMergedBranch({
        decodedChangesForDoc: changes,
        branchHeads: mergeHeads,
        mainHeads: encodeHeads(getHeads(doc)),
        baseHeads,
      }),
      mergeMetadata: {
        mergedAt,
        mergedBy,
        mergeHeads,
      },
    };
  }

  // Initialize an inclusion function specialized to this doc
  // (does some upfront doc-global work to avoid heavy work in the loop.)
  const includeChangeInHistoryForThisDoc = includeChangeInHistory
    ? includeChangeInHistory(doc)
    : undefined;

  // Now we loop over the changes and make our groups.
  for (let i = 0; i < changes.length; i++) {
    const decodedChange = changes[i];

    // HACK: previously creating a clone of a doc would add an additional empty change
    // this breaks the history. To make old docs work we filter out any changes without dependencies, except for the first change
    if (i !== 0 && decodedChange.deps.length === 0) {
      continue;
    }

    const skipChange =
      // See if the datatype wants this change to appear in the log
      includeChangeInHistoryForThisDoc &&
      !includeChangeInHistoryForThisDoc(decodedChange) &&
      // If a marker is present for this change, we have to include it so that the marker works.
      !markers.find((marker) => marker.heads.includes(decodedChange.hash));

    if (skipChange) {
      continue;
    }

    // If the change came from a merged branch, add it to the group for that branch,
    // don't include it in our raw grouping.
    let changeCameFromMergedBranch = false;
    for (const branchChangeGroup of Object.values(branchChangeGroups)) {
      if (branchChangeGroup.changeHashes.has(decodedChange.hash)) {
        // Now that we've hit changes from a branch, cut off the current group that was formed on main.
        // (TODO: maybe we should be looking out for "branch started" markers on the primary loop instead?)
        if (currentGroup) {
          pushGroup(currentGroup);
          currentGroup = null;
        }

        // we'll use this to break out of the main loop
        changeCameFromMergedBranch = true;
        branchChangeGroup.changeGroup = addChangeToGroup({
          group: branchChangeGroup.changeGroup,
          change: decodedChange,
        });

        // If this is the change that was the last one for the branch
        // pre-merged, then it's time to add the change group for this branch
        // to our list of groups
        if (
          branchChangeGroup.mergeMetadata.mergeHeads.includes(
            decodedChange.hash
          )
        ) {
          const markersForGroup = markers.filter((marker) =>
            isEqual(marker.heads, branchChangeGroup.mergeMetadata.mergeHeads)
          );
          const mergeMarker = markersForGroup.find(
            (m) => m.type === "otherBranchMergedIntoThisDoc"
          );
          if (mergeMarker) {
            //  we need to finalize the change group for the branch merge before we add it to the merge marker;
            // this will do things like calculate the diff for the group.
            // Normally this step is handled inside pushGroup, but here we aren't pushing to the
            // overall list of change groups, we're adding it to the merge marker.
            const finalized = finalizeChangeGroup({
              group: branchChangeGroup.changeGroup,
              doc,
              diffHeads:
                changeGroups.length > 0
                  ? [changeGroups[changeGroups.length - 1].to]
                  : [],
              options: {
                grouping,
                markers,
                includeChangeInHistory,
                includePatchInChangeGroup,
                fallbackSummaryForChangeGroup,
              },
            });

            branchChangeGroup.changeGroup.markers.push({
              ...mergeMarker,
              // @ts-expect-error this is fine; we know we're adding to a merge marker
              changeGroups: [finalized],
            });
            const otherMarkersForThisGroup = markersForGroup.filter(
              (m) => m !== mergeMarker
            );
            for (const marker of otherMarkersForThisGroup) {
              branchChangeGroup.changeGroup.markers.push(marker);
            }
          }
          // todo: what other finalizing do we need to do here..? any?
          pushGroup(branchChangeGroup.changeGroup);
        }

        continue;
      }
    }

    if (changeCameFromMergedBranch) {
      continue;
    }

    // Choose whether to add this change to the existing group or start a new group depending on the algorithm.
    if (currentGroup && grouping(currentGroup, decodedChange)) {
      currentGroup = addChangeToGroup({
        group: currentGroup,
        change: decodedChange,
      });
    } else {
      if (currentGroup) {
        pushGroup(currentGroup);
      }

      currentGroup = {
        id: `${decodedChange.hash}-${decodedChange.hash}`,
        from: decodedChange.hash,
        to: decodedChange.hash,
        changes: [decodedChange],
        actorIds: [decodedChange.actor],
        markers: [],
        time:
          decodedChange.time && decodedChange.time > 0
            ? decodedChange.time
            : undefined,
        authorUrls: decodedChange.metadata?.author
          ? [decodedChange.metadata.author as AutomergeUrl]
          : [],
      };
    }

    // add matching markers to group
    if (currentGroup) {
      // If this change is tagged, then we should end the current group.
      // This ensures we have a group boundary corresponding to the tag in the changelog.
      // TODO: The comparison here seems a little iffy; we're comparing heads to a single change hash...
      // how should this actually work?
      const matchingMarkers = markers.filter((marker) => {
        return marker.heads[0] === decodedChange.hash;
      });

      if (matchingMarkers.length > 0) {
        currentGroup.markers = matchingMarkers;
        pushGroup(currentGroup);
        currentGroup = null;
      }
    }
  }

  if (currentGroup) {
    pushGroup(currentGroup);
  }

  return { changeGroups, changeCount: changes.length };
};
