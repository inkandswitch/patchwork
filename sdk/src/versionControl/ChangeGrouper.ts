import * as A from "@automerge/automerge";
import { DocHandle } from "@automerge/automerge-repo";
import EventEmitter from "eventemitter3";
import { debounce, isEqual } from "lodash-es";
import {
  ChangeGroup,
  ChangeGroupingOptions,
  DecodedChangeWithMetadata,
  getMarkersForDoc,
  getTimelineItems,
  HeadsMarker,
  TimelineItems,
} from "./groupChanges";
import { HasVersionControlMetadata } from "./schema";
import { BranchScopeAndActiveBranchInfo } from "./signals";

export type BranchScopeAndActiveBranchInfoWithoutDoc = Omit<
  BranchScopeAndActiveBranchInfo,
  | "cloneOrMainOm"
  // exclude branchScopeOm, because that also points to the current doc
  // if the branch scope is on the document and we are editing on main
  | "branchScopeOm"
>;

// This keeps EventEmitter from being optimized away
Object.defineProperty(EventEmitter, "__register", { value: true });

const GROUPER_DEBOUNCE_MS = 1000;

/**This is a class that wraps a doc handle and emits events
 * when the changelog items change.
 * Most of the actual work gets delegated to getChangelogItems;
 * the main purpose of this stateful class is to improve performance
 * by maintaining a cache of decoded changes and by debouncing updates.
 */
export class ChangeGrouper<
  D extends HasVersionControlMetadata,
> extends EventEmitter {
  // An array of decoded changes on the doc.
  private decodedChanges: DecodedChangeWithMetadata[];
  private debouncedListener;
  items: TimelineItems<D>[] = [];

  private memoizedGroups?: {
    changeGroups: ChangeGroup<D>[];
    changeCount: number;
    options: ChangeGroupingOptions<D>;
  };

  constructor(
    private handle: DocHandle<D>,
    private groupingOptions: Omit<ChangeGroupingOptions<D>, "markers">,
    private branchScopeAndActiveBranchInfoWithoutDoc: BranchScopeAndActiveBranchInfoWithoutDoc
  ) {
    super();
    this.groupingOptions = groupingOptions;
    this.debouncedListener = debounce(
      () => this.populateItems(),
      GROUPER_DEBOUNCE_MS
    );
    this.decodedChanges = [];

    // Get change groups using initial state of the doc.
    if (handle.doc()) {
      this.populateItems();
    }

    // Listen for changes to the doc and update the items array as needed.
    let cachedMarkers: HeadsMarker<D>[];
    handle.on("change", () => {
      const markers = getMarkersForDoc(
        handle,
        branchScopeAndActiveBranchInfoWithoutDoc
      );
      if (!isEqual(markers, cachedMarkers)) {
        // If the markers on the doc have changed, then we immediately recompute change groups
        cachedMarkers = markers;
        this.populateItems();
      } else {
        // If the markers haven't changed, then do a debounced recompute.
        this.debouncedListener();
      }
    });
  }

  // Recompute changelog items for the current state of the doc
  private populateItems() {
    const doc = this.handle.doc();

    if (!doc) {
      console.warn(`Can't load doc ${this.handle.url}`);
      return;
    }

    // This call to getAllChanges is still quite slow; it'd be a lot faster
    // if Automerge simply had an API to get a subset of changes.
    const rawChanges = A.getAllChanges(doc);

    // Only decode new changes.
    // Note, this only works because new changes are added to the end of the list;
    // if that invariant changes we'll need a new way to keep track of which
    // changes we've already decoded.

    if (rawChanges.length > this.decodedChanges.length) {
      const newDecodedChanges = rawChanges
        .slice(this.decodedChanges.length)
        .map(decodeChangeAndParseMetadata);
      this.decodedChanges = this.decodedChanges.concat(newDecodedChanges);
      const markers = getMarkersForDoc(
        this.handle,
        this.branchScopeAndActiveBranchInfoWithoutDoc
      );

      const { items, memoizedGroups } = getTimelineItems({
        doc,
        mainUrl: this.branchScopeAndActiveBranchInfoWithoutDoc.originalUrl,
        changes: this.decodedChanges,
        options: { ...this.groupingOptions, markers },
        memoizedGroups: this.memoizedGroups,
      });
      this.items = items;
      this.memoizedGroups = memoizedGroups;
      this.emit("change", this.items);
    }
  }

  public teardown() {
    this.items = [];
  }
}

// NOTE: this should be pushed down the stack as we formalize
// support for structured metadata on changes.
const decodeChangeAndParseMetadata = (change: A.Change) => {
  let decodedChange = A.decodeChange(change) as DecodedChangeWithMetadata;
  decodedChange.metadata = {};
  const { message } = decodedChange;

  if (!message) {
    return decodedChange;
  }

  try {
    const metadata = JSON.parse(message);
    decodedChange = { ...decodedChange, metadata };
  } catch (e) {
    // do nothing for now...
  }
  return decodedChange;
};
