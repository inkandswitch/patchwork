import {
  ChangeGroup,
  DecodedChangeWithMetadata,
  PendingChangeGroup,
} from "@patchwork/sdk/versionControl";
import { Annotation, HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { TextPatch } from "@patchwork/sdk/versionControl";
import { next as A, Doc } from "@automerge/automerge";
import { DocHandle, Repo } from "@automerge/automerge-repo";
import { ReactElement } from "react";
import { FileExportMethod } from "./fileExports";
import { IconType } from "./lib/icons";
import { DocLink } from "./packages/folder";

export type CoreDataType<D> = {
  id: string;
  type: "patchwork:dataType";
  name: string;
  icon: IconType;
  init: (doc: D, repo: Repo) => void;
  getTitle: (doc: D, repo: Repo) => Promise<string>;
  setTitle?: (doc: any, title: string) => void;
  markCopy: (doc: D) => void; // TODO: this shouldn't be part of the interface
  actions?: Record<string, (doc: Doc<D>, args: object) => void>;
  fileExportMethods?: FileExportMethod<D>[];
  /* Marking a data types as experimental hides it by default
   * so the user has to enable them in their account first  */
  isExperimental?: boolean;

  /* If this flag is enabled the data type won't show up in the new document menu */
  disableManualCreation?: boolean;

  // UNIX SYNC (for Jacquard)
  // Pulling
  docToUnixFile?: (doc: D) => Promise<{
    content: string | Uint8Array;
    fileName?: string; // defaults to name provided in DocLink
  }>;
  // Pushing
  initDocFromUnixFile?: (
    content: string | Uint8Array,
    fileName: string,
    handle: DocHandle<D>
  ) => Promise<void>;
  updateDocFromUnixFile?: (
    content: string | Uint8Array,
    handle: DocHandle<D>
  ) => Promise<{ didChange: boolean }>;
  unixFileExtensions?: string[];
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
};

export type DataType<D = unknown, T = unknown, V = unknown> = CoreDataType<D> &
  VersionedDataType<D, T, V>;

export const isDataType = (value: any): value is DataType => {
  return "type" in value && value.type === "patchwork:dataType";
};

export const dataTypeById = <D, T, V>(
  dataTypes: DataType[],
  id: string | undefined
) => {
  return dataTypes.find((dataType) => dataType.id == id) as
    | DataType<D, T, V>
    | undefined;
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

// export type LoadedDocHandle<D> = Omit<DocHandle<D>, "docSync"> & {
//   docSync: () => Readonly<D>;
// };

// export const loadHandle = async <D>(
//   handle: DocHandle<D>
// ): Promise<LoadedDocHandle<D> | undefined> => {
//   const doc = await handle.doc();
//   if (!doc) {
//     return undefined;
//   }
//   return handle as LoadedDocHandle<D>;
// };
