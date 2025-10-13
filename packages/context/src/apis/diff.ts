import * as Automerge from "@automerge/automerge";
import { DocHandle } from "@automerge/automerge-repo";
import { last } from "../utils/last";
import { lookup } from "../utils/lookup";
import { memoize } from "../utils/memoize";
import { CONTEXT } from "../core";
import { contextComputation } from "../core/computation";
import { defineField } from "../core/fields";
import { PathRef, Ref, RefWith, TextSpanRef } from "../core/refs";

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

export type DiffValue<T = unknown> =
  | AddedDiff
  | ChangedDiff<T>
  | DeletedDiff<T>;

const DiffSymbol = Symbol("diff");
export type Diff = typeof DiffSymbol;
export const Diff = defineField<Diff, DiffValue>("diff", DiffSymbol);

export const getDiffOfDoc = (
  docHandle?: DocHandle<unknown>,
  headsBefore?: Automerge.Heads
): RefWith<Diff>[] => {
  const changedRefs: RefWith<Diff>[] = [];

  if (!headsBefore || !docHandle) {
    return [];
  }

  const docBefore = Automerge.view(docHandle.doc(), headsBefore);
  const docAfter = docHandle.doc();

  const patches = Automerge.diff(
    docAfter,
    headsBefore,
    Automerge.getHeads(docAfter)
  );

  // Track which ancestor paths we've marked as modified during this pass
  const modifiedPaths = new Set<string>();

  for (const patch of patches) {
    const ancestorPath =
      typeof last(patch.path) === "number"
        ? patch.path.slice(0, -1)
        : patch.path;

    // First, ensure ancestors are marked as modified incrementally.
    // We assume patches are ordered from higher-level to lower-level paths.
    // Add modified for all ancestors above the leaf (exclude root and the leaf itself).
    for (let i = ancestorPath.length; i > 0; i--) {
      const ancestorSubPath = ancestorPath.slice(0, i);
      const key = JSON.stringify(ancestorSubPath);
      if (modifiedPaths.has(key)) break;
      const ancestorRef = new PathRef(docHandle, ancestorSubPath);
      const before = lookup(docBefore, ancestorSubPath);

      if (before) {
        changedRefs.push(ancestorRef.with(Diff({ type: "changed", before })));
      } else {
        changedRefs.push(ancestorRef.with(Diff({ type: "added" })));
      }

      modifiedPaths.add(key);
    }

    // Then add leaf annotations for the specific patch
    const objRef = new PathRef(docHandle, patch.path);

    switch (patch.action) {
      case "put":
        changedRefs.push(objRef.with(Diff({ type: "added" })));
        break;

      case "del": {
        // is this a span deletion?
        if (typeof last(patch.path) === "number") {
          // const length = patch.length ?? 1;
          const parentPath = patch.path.slice(0, -1);
          const parent = lookup(docBefore, parentPath);

          console.log("position", last(patch.path));

          // for text mark the span as deleted
          if (typeof parent === "string") {
            const position = last(patch.path) as number;
            // const cursor = Automerge.getCursor(
            //   docAfter,
            //   parentPath,
            //   position
            // );

            // const from = Automerge.getCursorPosition(
            //   docBefore,
            //   parentPath,
            //   cursor
            // );
            // const to = from + patch.length;

            const textSpan = new TextSpanRef(
              docHandle,
              parentPath,
              position,
              position
            );

            // todo: implement
            const before = "";

            changedRefs.push(textSpan.with(Diff({ type: "deleted", before })));

            // for arrays mark the indiviual objects in the range as deleted
          } else if (Array.isArray(parent)) {
            throw new Error("not implemented");
          } else {
            throw new Error("Unexpected value, this should never happen");
          }

          // ... otherwise this is a deletion of a key in an object
        } else {
          const before = lookup(docBefore, patch.path);
          changedRefs.push(objRef.with(Diff({ type: "deleted", before })));
        }
        break;
      }

      case "insert": {
        changedRefs.push(objRef.with(Diff({ type: "added" })));
        break;
      }

      case "splice":
        {
          const parentPath = patch.path.slice(0, -1);
          const from = last(patch.path) as number;
          const to = from + patch.value.length;
          const textSpan = new TextSpanRef(docHandle, parentPath, from, to);

          changedRefs.push(textSpan.with(Diff({ type: "added" })));
        }
        break;
    }
  }

  return changedRefs;
};

export const getDiff = memoize(
  (ref: Ref) => contextComputation(() => CONTEXT.resolve(ref).get(Diff)),
  (ref: Ref) => ref.toId()
);

export const getRefsWithDiffAt = memoize(
  (ref?: Ref) =>
    contextComputation(() => {
      if (!ref) {
        return [];
      }

      return CONTEXT.refsWith(Diff).filter((refWithDiff) =>
        refWithDiff.isElementOf(ref)
      );
    }),
  (ref?: Ref) => ref?.toId()
);
