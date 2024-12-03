import { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import * as A from "@automerge/automerge/next";
import { TextPatch } from "./utils";
import { HasAssets, withHasAssets } from "../assets";
import { CursorPatch as CursorPatch } from "./cursorPatch";
import { ChatMessage } from "./bots";

export type HasBotChatHistory = {
  botChatHistory: ChatMessage[];
};

export const withHasBotChatHistory = <D extends object>(
  doc: D
): D & HasBotChatHistory => {
  return {
    ...doc,
    botChatHistory: [],
  };
};

// This is a separate doc to store version control metadata.
// Eventually we envision all VC metadata living in here.
// But for now, we have some metadata living in docs themselves, and
// some living in this sidecar.
// TODO: "Sidecar" in here is provisional until we remove old branches

export type VersionControlSidecarDoc = BranchScopeMetadata &
  HasChangeGroupSummaries;

type BranchScopeMetadata =
  | {
      isBranchScope: false;
    }
  | {
      isBranchScope: true;
      branches: AutomergeUrl[];
    };

export type HasLinkToVersionControlSidecar = {
  versionControlMetadataUrl: AutomergeUrl;
};

export const withHasLinkToVersionControlSidecar = <D>(
  doc: D,
  versionControlMetadataUrl: AutomergeUrl
): D & HasLinkToVersionControlSidecar => ({
  ...doc,
  versionControlMetadataUrl,
});

export type DocCloneMap = {
  [key: string]: {
    url: AutomergeUrl;
    // The base of the branch = the heads at which this branch was created
    baseHeads: A.Heads;
  };
};

// Represents a branch across multiple documents
export type UnmergedBranchDoc = {
  /* A mapping of URLs of "main" docs to clones representing that doc on this branch */
  clones: DocCloneMap;

  name: string;

  /** timestamp when the branch was created */
  createdAt: number;

  /** author contact doc URL for branch creator */
  createdBy?: AutomergeUrl;

  /**  doc on which the branch scope was created */
  branchScopeUrl: AutomergeUrl;

  mergeMetadata: null;
};

export type MergedBranchDoc = Omit<UnmergedBranchDoc, "mergeMetadata"> & {
  mergeMetadata: {
    /** timestamp when the branch was merged */
    mergedAt: number;

    /** Heads of the branch at the point it was merged */
    mergeHeadsByDocUrl: Record<AutomergeUrl, A.Heads>;

    /** author contact doc URL for branch merger */
    mergedBy: AutomergeUrl;
  };
};

export type BranchDoc = UnmergedBranchDoc | MergedBranchDoc;

// A data structure that lets us pass around diffs while remembering
// where they came from
export type DiffWithProvenance = {
  patches: (A.Patch | TextPatch)[];
  /** The heads of the doc before the patches */
  fromHeads: A.Heads;
  /** The heads of the doc after the patches */
  toHeads: A.Heads;
};

export type DiscussionComment = {
  id: string;
  content: string;
  contactUrl: AutomergeUrl;
  timestamp: number;
};

// Right now discussions are both used in the timeline and for comments on the document
// We should split this up and use separate concepts
export type Discussion<T> = {
  id: string;
  heads: A.Heads;
  resolved: boolean;
  comments: DiscussionComment[];

  // a list of doc anchors that this discussion refers to
  // an empty anchors array means, that this discussion is a general comment on the overall document
  anchors: T[];
};

export type AnnotationGroup<T, V> = {
  annotations: Annotation<T, V>[];
  discussion?: Discussion<T>;
};

export type CommentState<T> =
  | { type: "edit"; commentId: string }
  | { type: "create"; target: string | T[] | undefined };

export type AnnotationGroupCommentState =
  | { type: "create" }
  | { type: "edit"; commentId: string };

export type AnnotationGroupWithUIState<T, V> = AnnotationGroup<T, V> & {
  state: "focused" | "expanded" | "neutral";
  comment?: AnnotationGroupCommentState;
};

export type Discussable<T> = {
  discussions: { [key: string]: Discussion<T> };
};

export const withDiscussable = <D = unknown, T = unknown>(
  doc: D
): D & Discussable<T> => ({
  ...doc,
  discussions: {},
});

export type HasChangeGroupSummaries = {
  changeGroupSummaries: {
    [key: string]: {
      title: string;
    };
  };
};

export const withHasChangeGroupSummaries = <D>(
  doc: D
): D & HasChangeGroupSummaries => ({
  ...doc,
  changeGroupSummaries: {},
});

export type HasVersionControlMetadata<
  TAnchor = unknown,
  TAnchorValue = unknown
> = HasChangeGroupSummaries &
  Discussable<TAnchor> &
  // @Paul 5/24/24
  // todo: we should rethink how to structure core interfaces
  // the application now assumes that all document types in the system implement HasVersionControlMetadata
  // HasAssets is also a universal interface that can be used with any document but it's not really related to versioning
  // We should create a base schema that's a union of all interfaces that we can assume all documents implement but
  // split them up into logical sub interfaces like versioning, commenting, assets, etc
  HasAssets &
  HasBotChatHistory &
  HasLinkToVersionControlSidecar;

export const withHasVersionControlMetadata = <
  D = unknown,
  T = unknown,
  V = unknown
>(
  doc: D,
  {
    versionControlMetadataUrl,
    assetsDocUrl,
  }: {
    versionControlMetadataUrl: AutomergeUrl;
    assetsDocUrl: AutomergeUrl;
  }
): D & HasVersionControlMetadata<T, V> =>
  withHasAssets(
    withHasLinkToVersionControlSidecar(
      withHasBotChatHistory(
        withHasChangeGroupSummaries(
          withDiscussable(withHasChangeGroupSummaries(doc))
        )
      ),
      versionControlMetadataUrl
    ),
    assetsDocUrl
  );

export type AnnotationId = string & { __annotationId: true };

export type AddAnnotation<A, V> = {
  type: "added";
  anchor: A;
  added: V;
  inversePatches?: CursorPatch[];
};

export type DeleteAnnotation<A, V> = {
  type: "deleted";
  anchor: A;
  deleted: V;
  inversePatches?: CursorPatch[];
};

export type ChangeAnnotation<A, V> = {
  type: "changed";
  anchor: A;
  before: V;
  after: V;
  inversePatches?: CursorPatch[];
};

export type HighlightAnnotation<A, V> = {
  type: "highlighted";
  anchor: A;
  value: V;
};

export type Annotation<Anchor, Value> =
  | AddAnnotation<Anchor, Value>
  | DeleteAnnotation<Anchor, Value>
  | ChangeAnnotation<Anchor, Value>
  | HighlightAnnotation<Anchor, Value>;

export type AnnotationWithUIState<A, V> = Annotation<A, V> & {
  /** Whether the annotation should be visually emphasized in the UI (eg, with darker coloring).
   *  This is used to indicate hovered/selected annotations within the UI.
   */
  isEmphasized: boolean;

  /** Whether the annotation should be scrolled into view in the UI.
   */
  shouldBeVisibleInViewport: boolean;
};

export interface AnnotationPosition<A, V> {
  x: number;
  y: number;
  annotation: Annotation<A, V>;
}

type VersionControlMetadataDocOptions = {
  branchScope?: boolean;
};

export const initVersionControlMetadata = (
  doc: any,
  repo: Repo,
  options?: VersionControlMetadataDocOptions
) => {
  doc.discussions = {};
  doc.tags = [];
  doc.changeGroupSummaries = {};

  initVersionControlSidecarDoc(doc, repo, options);
};

export const initVersionControlSidecarDoc = (
  doc: any,
  repo: Repo,
  options: VersionControlMetadataDocOptions = { branchScope: false }
) => {
  // init the separate metadata doc
  const metadataHandle = repo.create<VersionControlSidecarDoc>({
    isBranchScope: false,
    changeGroupSummaries: {},
  });
  metadataHandle.change((d) => {
    d.isBranchScope = false;
    d.changeGroupSummaries = {};
  });
  if (options.branchScope) {
    ensureMetadataHandleIsBranchScope(metadataHandle);
  }
  doc.versionControlMetadataUrl = metadataHandle.url;
};

export const getVersionControlMetadataHandle = (
  handle: DocHandle<any>,
  repo: Repo
): DocHandle<VersionControlSidecarDoc> => {
  const doc = handle.docSync();

  if (!doc) {
    throw new Error(`document is not available ${handle.url}`);
  }

  let versionControlMetadataUrl = doc.versionControlMetadataUrl;
  if (!versionControlMetadataUrl) {
    handle.change((d) => {
      initVersionControlSidecarDoc(d, repo);
      versionControlMetadataUrl = d.versionControlMetadataUrl;
    });
  }
  return repo.find<VersionControlSidecarDoc>(versionControlMetadataUrl);
};

export const ensureMetadataHandleIsBranchScope = (
  handle: DocHandle<VersionControlSidecarDoc>
) => {
  handle.change((d) => {
    if (!d.isBranchScope) {
      // @ts-expect-error TS not smart enough to figure this one out
      d.isBranchScope = true;
      // @ts-expect-error TS not smart enough to figure this one out
      d.branches = [];
    }
  });
  return handle as DocHandle<
    VersionControlSidecarDoc & { isBranchScope: true }
  >;
};
