import EventEmitter from "eventemitter3";
import {
  ChangeGroup,
  DecodedChangeWithMetadata,
  PendingChangeGroup,
  Annotation,
  HasVersionControlMetadata,
  TextPatch,
} from "./versionControl";
import { next as A, Doc } from "@automerge/automerge";
import { DocHandle, Repo } from "@automerge/automerge-repo";
import { ReactElement } from "react";
import { IconType } from "./ui";
import { DocMigration } from "./migrations/DocMigration";
import { HasPatchworkMetadata } from "./modules/types";
import { DocLink } from "./router/DocLink";

export type DataType<
  D = unknown,
  T = unknown,
  V = unknown
> = DataTypeDescription &
  DataTypeImplementation<D, T, V> &
  Omit<DataTypeDescription, "load">;

export type DataTypeDescription<D = unknown, T = unknown, V = unknown> = {
  id: string;
  type: "patchwork:dataType";
  name: string;
  icon: IconType;
  unlisted?: boolean;
  importUrl?: string; // populated at registration-time
  load(): Promise<DataTypeImplementation<D, T, V>>;
};

export type CoreDataType<D> = {
  init: (doc: D, repo: Repo) => void;
  getTitle: (doc: D, repo: Repo) => Promise<string>;
  setTitle?: (doc: any, title: string) => void;
  markCopy: (doc: D) => void; // TODO: this shouldn't be part of the interface
  actions?: Record<string, (doc: Doc<D>, args: object) => void>;
};

export type VersionedDataType<D, T, V> = {
  // TODO (GL 3/12/24): we'd like to unify these two filter methods
  // and possibly combine them with grouping logic soon.

  // Mark whether a given change should be included in the history.
  // Note: This function has a strange signature that takes in a doc and a change
  // independently in a curried way. This is because we want to do doc-global
  // stuff just once up front for performance, and then reuse when checking each change.
  // (See the implementation for Markdown docs as one example.)
  // If Automerge had more ergonomic APIs for observing what ops did, this wouldn't be needed.
  includeChangeInHistory?: (
    doc: D
  ) => (change: DecodedChangeWithMetadata) => boolean;

  // Mark whether a given patch should be included in the history
  includePatchInChangeGroup?: (patch: A.Patch | TextPatch) => boolean; // todo: can we get rid of TextPatch here?

  /** A datatype can define two ways of summarizing a change group.
   *  - The first is a "fallback summary": computed deterministically based on the group contents,
   *  and intended to be a cheap default summary.
   *  - The second is a prompt for an AI summary. This lets an LLM (expensively) compute a string
   *  that summarizes the contents of the change group.
   *
   *  Both are optional.
   * - If a fallback summary isn't provided, Patchwork will fill in a generic summary.
   * - If the AI prompt isn't provided, AI summarization won't run for this datatype.
   */

  /* Generate a summary of a change group based on its contents */
  fallbackSummaryForChangeGroup?: (
    changeGroup: ChangeGroup<D>
  ) => string | ReactElement;

  /* Generate a prompt for an LLM to summarize a change group */
  promptForAIChangeGroupSummary?: (args: {
    docBefore: D;
    docAfter: D;
  }) => string;

  /* Turn a list of patches into annotations to display in the UI */
  patchesToAnnotations?: (
    doc: D,
    docBefore: D,
    patches: A.Patch[]
  ) => Annotation<T, V>[];

  /* Group annotations into logical units. This function get's passed all annotations
   * that are not associated with any discussions
   *
   * The sort order is not preserved. For sorting implement the sortAnchorsBy method.
   */
  groupAnnotations?: (annotations: Annotation<T, V>[]) => Annotation<T, V>[][];

  /* Resolves to the value the anchor is pointing to in a document.
   * If the anchor cannot be resolved return undefined.
   * If not defined, annotations in the review sidebar won't include the
   * contents of the annotated data.
   */
  valueOfAnchor?: (doc: D, anchor: T) => V | undefined;

  /* Checks if two anchors overlap. This is used to associate edit annotations with
   * discussions. A discussion grabs any annotations that overlap with the anchors
   * associated with the discussion
   *
   * If this method is not implemented deep equal will be used as a fallback
   */
  doAnchorsOverlap?: (doc: D, anchor1: T, anchor2: T) => boolean;

  /** Defines a value for each anchor that will be use to sort them by in descending order.
   *  This is used for example in the SpatialSidebar to sort the annotation group.
   *
   *  If this method is not implemented the anchors will not be sorted.
   */
  sortAnchorsBy?: (doc: D, anchor: T) => any;

  /**
   * Specifies how changes are grouped for more details look in: groupChange.ts
   */
  groupChanges?: (
    currentGroup: PendingChangeGroup<D>,
    newChange: DecodedChangeWithMetadata
  ) => boolean;

  /**
   * Specifies what other Automerge documents are "linked to" from this
   * document. This is currently used to figure out which documents to clone
   * when a branch is created.
   */
  links?: (doc: D) => DocLink[];

  /**
   * List of available migrations for this data type
   */
  migrations?: DocMigration[];
};

export type DataTypeImplementation<
  D = unknown,
  T = unknown,
  V = unknown
> = CoreDataType<D> & VersionedDataType<D, T, V>;

export const isDataType = (value: unknown): value is DataType => {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    (value as DataType).type === "patchwork:dataType"
  );
};

export type DataTypesMap = Record<string, DataType<unknown, unknown, unknown>>;
export type DataTypeEvents = {
  "datatypes:changed": (datatypes: DataTypesMap) => void;
};
export const datatypeEvents = new EventEmitter<DataTypeEvents>();
const GlobalDataTypes: DataTypesMap = {};

export const registerDataType = async (
  datatype: DataTypeDescription<unknown, unknown, unknown>,
  importUrl: string
) => {
  GlobalDataTypes[datatype.id] = {
    ...datatype,
    importUrl,
    ...(await datatype.load()),
  };
  datatypeEvents.emit("datatypes:changed", { ...GlobalDataTypes });
};

export const allDataTypes = () => {
  return { ...GlobalDataTypes };
};

export const dataTypeById = <D, T, V>(id: string | undefined) => {
  return id ? GlobalDataTypes[id] : undefined;
};

/** Creates a new document initialized with the given datatype */
export const createDocOfDataType = <D>(
  dataType: DataType<D>,
  repo: Repo,
  change?: (doc: D) => void
): DocHandle<D & HasPatchworkMetadata> => {
  const handle = repo.create<D & HasPatchworkMetadata>();
  handle.change((doc) => {
    dataType.init(doc, repo);
    (doc as any)["@patchwork"] = {
      type: dataType.id,
      suggestedImportUrl: dataType.importUrl,
    };
    if (change) {
      change(doc);
    }
  });
  return handle;
};

/** Kinda hacky utility function to initialize an object in
 * handle.change in a type-safe way. */
export const initFrom = <D extends object>(
  doc: D,
  init: Omit<D, keyof HasVersionControlMetadata<unknown, unknown>>
) => {
  Object.assign(doc, init);
};

// experimental "LoadedDocHandle"

// export type LoadedDocHandle<D> = Omit<DocHandle<D>, "doc"> & {
//   doc: () => Readonly<D>;
// };

// export const loadHandle = async <D>(
//   handle: DocHandle<D>
// ): Promise<LoadedDocHandle<D> | undefined> => {
//   const doc = handle.doc();
//   if (!doc) {
//     return undefined;
//   }
//   return handle as LoadedDocHandle<D>;
// };
