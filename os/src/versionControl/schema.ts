import { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import * as A from "@automerge/automerge/next";
import { TextPatch } from "./utils";
import { HasAssets } from "@/assets";
import { HasBotChatHistory } from "./components/BotSidebar";

// This is a separate doc to store version control metadata.
// Eventually we envision all VC metadata living in here.
// But for now, we have some metadata living in docs themselves, and
// some living in this sidecar.
// TODO: "Sidecar" in here is provisional until we remove old branches
export type VersionControlSidecarDoc =
  | {
      isBranchScope: false;
    }
  | {
      isBranchScope: true;
      branches: AutomergeUrl[];
    };

type HasLinkToVersionControlSidecar = {
  versionControlMetadataUrl: AutomergeUrl;
};

export type DocCloneMap = {
  [key: string]: {
    url: AutomergeUrl;
    // The base of the branch = the heads at which this branch was created
    baseHeads: A.Heads;
  };
};

// Represents a branch across multiple documents
export type BranchDoc = {
  /* A mapping of URLs of "main" docs to clones representing that doc on this branch */
  clones: DocCloneMap;

  name: string;

  /** timestamp when the branch was created */
  createdAt: number;

  /** author contact doc URL for branch creator */
  createdBy?: AutomergeUrl;

  mergeMetadata?: {
    /** timestamp when the branch was merged */
    mergedAt: number;
    /** Heads of the branch at the point it was merged */
    // TODO: record merge heads per doc on branch
    // mergeHeads: A.Heads;
    /** author contact doc URL for branch merger */
    mergedBy: AutomergeUrl;
  };
};

export type LegacyBranch = {
  name: string;
  /** URL pointing to the clone doc */
  url: AutomergeUrl;
  /** timestamp when the branch was created */
  createdAt: number;
  /** Heads when the branch was created */
  branchHeads: A.Heads;
  /** author contact doc URL for branch creator */
  createdBy?: AutomergeUrl;

  mergeMetadata?: {
    /** timestamp when the branch was merged */
    mergedAt: number;
    /** Heads of the branch at the point it was merged */
    mergeHeads: A.Heads;
    /** author contact doc URL for branch merger */
    mergedBy: AutomergeUrl;
  };
};

export type Branchable = {
  branchMetadata: {
    /* A pointer to the source where this was copied from */
    source: {
      url: AutomergeUrl;
      branchHeads: A.Heads; // the heads at which this branch was forked off
    } | null;

    /* A pointer to copies of this doc */
    branches: Array<LegacyBranch>;
  };
};

export type Tag = {
  name: string;
  heads: A.Heads;
  createdAt: number;
  createdBy?: AutomergeUrl;
};
export type Taggable = {
  // TODO: should we model this as a map instead?
  tags: Tag[];
};

export type Diffable = {
  diffBase: A.Heads;
};

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
  contactUrl?: AutomergeUrl;
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

export type HasChangeGroupSummaries = {
  changeGroupSummaries: {
    [key: string]: {
      title: string;
    };
  };
};

export type HasVersionControlMetadata<
  TAnchor = unknown,
  TAnchorValue = unknown
> = HasChangeGroupSummaries &
  Branchable &
  Taggable &
  Diffable &
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

export type AnnotationId = string & { __annotationId: true };

interface AddAnnotation<A, V> {
  type: "added";
  anchor: A;
  added: V;
}

interface DeleteAnnotation<A, V> {
  type: "deleted";
  anchor: A;
  deleted: V;
}

interface ChangeAnnotation<A, V> {
  type: "changed";
  anchor: A;
  before: V;
  after: V;
}

export interface HighlightAnnotation<A, V> {
  type: "highlighted";
  anchor: A;
  value: V;
}

export type Annotation<A, V> =
  | AddAnnotation<A, V>
  | DeleteAnnotation<A, V>
  | ChangeAnnotation<A, V>
  | HighlightAnnotation<A, V>;

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

export const initVersionControlMetadata = (doc: any, repo: Repo) => {
  doc.branchMetadata = {
    source: null,
    branches: [],
  };
  doc.discussions = {};
  doc.tags = [];
  doc.changeGroupSummaries = {};

  initVersionControlMetadataDoc(doc, repo);
};

export const initVersionControlMetadataDoc = (doc: any, repo: Repo) => {
  // init the separate metadata doc
  const metadataHandle = repo.create<VersionControlSidecarDoc>();
  metadataHandle.change((d) => {
    d.isBranchScope = false;
  });
  doc.versionControlMetadataUrl = metadataHandle.url;
};

export const getVersionControlMetadataHandle = (
  handle: DocHandle<any>,
  repo: Repo
): DocHandle<VersionControlSidecarDoc> => {
  const doc = handle.docSync();
  let versionControlMetadataUrl = doc.versionControlMetadataUrl;
  if (!versionControlMetadataUrl) {
    handle.change((d) => {
      initVersionControlMetadataDoc(d, repo);
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
      d.isBranchScope = true;
      // @ts-expect-error TS not smart enough to figure this one out
      d.branches = [];
    }
  });
  return handle as DocHandle<
    VersionControlSidecarDoc & { isBranchScope: true }
  >;
};
