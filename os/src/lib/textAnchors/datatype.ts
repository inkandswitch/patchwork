import { Annotation } from "@/sdk";
import {
  getCursorPositionSafely,
  getCursorSafely,
} from "@/versionControl/utils";
import * as Automerge from "@automerge/automerge/next";
import { get, isEqual } from "lodash";

export type TextAnchor = {
  fromCursor: Automerge.Cursor;
  toCursor: Automerge.Cursor;
};

export type ResolvedTextAnchor = TextAnchor & {
  fromPos: number;
  toPos: number;
};

export type TextAnchorMethods<D> = {
  patchesToAnnotations: (
    doc: D,
    docBefore: D,
    patches: Automerge.Patch[]
  ) => Annotation<TextAnchor, string>[];

  valueOfAnchor: (doc: D, anchor: TextAnchor) => string;

  doAnchorsOverlap: (
    doc: D,
    anchor1: TextAnchor,
    anchor2: TextAnchor
  ) => boolean;

  sortAnchorsBy: (doc: D, anchor: TextAnchor) => number;
};

export const textAnchorsAtPath = <D>(
  path: Automerge.Prop[]
): TextAnchorMethods<D> => ({
  patchesToAnnotations: (doc: D, docBefore: D, patches: Automerge.Patch[]) => {
    const filteredPatches = patches.filter(
      (patch) =>
        isEqual(patch.path.slice(0, -1), path) &&
        (patch.action === "splice" || patch.action === "del")
    );

    const annotations: Annotation<TextAnchor, string>[] = [];

    const content: string = get(doc, path);
    const contentBefore: string = get(docBefore, path);

    // We keep track of the offset between doc and docBefore.
    //
    // - everytime we encounter an insert we add the length of the inserted string
    // - everytime we encounter a delete we subtract the number of deleted characters
    //
    // We can then translate positions in the new doc to positions in the old doc by subtracting the offset
    //
    // Note: we can't use cursors for this position translation because the cursor functions
    // always operate on the most recent version of a document even if you pass in a document at some heads
    let offset = 0;

    for (let i = 0; i < filteredPatches.length; i++) {
      const patch = filteredPatches[i];

      switch (patch.action) {
        case "splice": {
          const patchStart = patch.path[1] as number;
          const patchEnd = Math.min(
            (patch.path[1] as number) + patch.value.length,
            content.length - 1
          );
          const fromCursor = getCursorSafely(doc, ["content"], patchStart);
          const toCursor = getCursorSafely(doc, ["content"], patchEnd);

          if (!fromCursor || !toCursor) {
            console.warn("Failed to get cursor for patch", patch);
            break;
          }

          const nextPatch = filteredPatches[i + 1];
          if (
            nextPatch &&
            nextPatch.action === "del" &&
            nextPatch.path[1] === patchEnd
          ) {
            const before = contentBefore.slice(
              patchStart - offset,
              patchStart - offset + nextPatch.length
            );

            annotations.push({
              type: "changed",
              before,
              after: patch.value,
              anchor: {
                fromCursor: fromCursor,
                toCursor: toCursor,
              },
            });

            offset += patch.value.length - nextPatch.length;

            i += 1;
          } else {
            annotations.push({
              type: "added",
              added: patch.value,
              anchor: {
                fromCursor: fromCursor,
                toCursor: toCursor,
              },
            });

            offset += patch.value.length;
          }
          break;
        }
        case "del": {
          const patchStart = patch.path[1] as number;
          const patchEnd = (patch.path[1] as number) + 1;
          const fromCursor = getCursorSafely(doc, ["content"], patchStart);
          const toCursor = getCursorSafely(doc, ["content"], patchEnd);

          const deleted = contentBefore.slice(
            patchStart - offset,
            patchStart - offset + patch.length
          );

          offset -= patch.length;

          if (!fromCursor || !toCursor) {
            console.warn("Failed to get cursor for patch", patch);
            break;
          }

          annotations.push({
            type: "deleted",
            deleted,
            anchor: {
              fromCursor: fromCursor,
              toCursor: toCursor,
            },
          });
          break;
        }

        default:
          throw new Error("invalid patch");
      }
    }

    return annotations;
  },

  valueOfAnchor: (doc: D, anchor: TextAnchor) => {
    const from = getCursorPositionSafely(doc, ["content"], anchor.fromCursor);
    const to = getCursorPositionSafely(doc, ["content"], anchor.toCursor);

    // if the anchor points to an empty range return undefined
    // so highlight comments that point to this will be filtered out
    if (from === to) {
      return undefined;
    }

    return get(doc, path).slice(from, to);
  },

  doAnchorsOverlap: (doc: D, anchor1: TextAnchor, anchor2: TextAnchor) => {
    const from1 = getCursorPositionSafely(doc, ["content"], anchor1.fromCursor);
    const to1 = getCursorPositionSafely(doc, ["content"], anchor1.toCursor);
    const from2 = getCursorPositionSafely(doc, ["content"], anchor2.fromCursor);
    const to2 = getCursorPositionSafely(doc, ["content"], anchor2.toCursor);

    return Math.max(from1, from2) <= Math.min(to1, to2);
  },

  sortAnchorsBy: (doc: D, anchor: TextAnchor) => {
    return getCursorPositionSafely(doc, ["content"], anchor.fromCursor);
  },
});
