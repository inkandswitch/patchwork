import { Automerge } from "@automerge/automerge-repo/slim";
import { defineAnnotationType } from "@inkandswitch/annotations";

type AddedDiff = {
  type: "added";
};

type ChangedDiff<T> = {
  type: "changed";
  before: T;
};

type DeletedDiff<T> = {
  type: "deleted";
  before: T;
};

export type Diff<T = unknown> = AddedDiff | ChangedDiff<T> | DeletedDiff<T>;

export type ViewHeads = {
  beforeHeads: Automerge.Heads;
  afterHeads: Automerge.Heads;
};

/**
 * Annotation type for marking refs with diff information.
 */
export const Diff = defineAnnotationType<Diff>("patchwork/diff");

/**
 * Annotation type for marking refs with view heads (for time-travel diffing).
 */
export const ViewHeads = defineAnnotationType<ViewHeads>("patchwork/viewHeads");
