import { Annotation } from "@/sdk";
import {
  getCursorPositionSafely,
  getCursorSafely,
} from "@/versionControl/utils";
import * as Automerge from "@automerge/automerge/next";
import { get, isEqual, last } from "lodash";
import { diffWords } from "diff";

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

export const textAnchorsAtPath = <D extends Automerge.Doc<unknown>>(
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
      let patch = filteredPatches[i];
      let nextPatch = filteredPatches[i + 1];

      // swap del and splice so we don't have to handle the cases [del, splice] and [splice, del]
      // separately in the rest of the code
      if (
        patch.action === "del" &&
        nextPatch &&
        nextPatch.action === "splice" &&
        last(patch.path) === last(nextPatch.path)
      ) {
        const _patch = patch;
        patch = nextPatch;
        nextPatch = filteredPatches[i + 1] = _patch;
      }

      switch (patch.action) {
        case "splice": {
          const fromPos = last(patch.path) as number;
          const toPos = Math.min(
            (last(patch.path) as number) + patch.value.length,
            content.length - 1
          );

          const fromCursor = Automerge.getCursor(doc, path, fromPos);
          const toCursor = Automerge.getCursor(doc, path, toPos);

          if (!fromCursor || !toCursor) {
            console.warn("Failed to get cursor for patch", patch);
            break;
          }

          if (
            nextPatch &&
            nextPatch.action === "del" &&
            (last(nextPatch.path) === toPos || last(nextPatch.path) === fromPos)
          ) {
            const nextPatchLength = nextPatch.length ?? 1;
            const deleted = contentBefore.slice(
              fromPos - offset,
              fromPos - offset + nextPatchLength
            );
            const inserted = patch.value;

            annotations.push(
              ...diffText(deleted, inserted, doc, path, fromPos)
            );

            offset += patch.value.length - nextPatchLength;
            i += 1;
          } else {
            annotations.push({
              type: "added",
              added: patch.value,
              anchor: {
                fromCursor: fromCursor,
                toCursor: toCursor,
              },
              inversePatches: [
                {
                  action: "del",
                  path,
                  cursor: fromCursor,
                  length: patch.value.length,
                },
              ],
            });

            offset += patch.value.length;
          }
          break;
        }
        case "del": {
          const patchStart = last(patch.path) as number;

          // the right solution would be to resolve the cursor in docBefore
          // but cursor resolution always uses the latest doc even if you pass in an older version of the doc
          // so instead we make sure that the index is within the lenght of the current doc
          const cursor = getCursorSafely(
            doc,
            path,
            Math.min(patchStart, content.length - 1)
          );

          const patchLength = patch.length ?? 1; // length is undefined if only one character is deleted
          const deleted = contentBefore.slice(
            patchStart - offset,
            patchStart - offset + patchLength
          );

          offset -= patchLength;

          if (!cursor) {
            console.warn("Failed to get cursor for patch", patch);
            break;
          }

          annotations.push({
            type: "deleted",
            deleted,
            anchor: {
              fromCursor: cursor,
              toCursor: cursor,
            },
            inversePatches: [
              {
                action: "splice",
                path,
                cursor,
                value: deleted,
              },
            ],
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
    const from = getCursorPositionSafely(doc, path, anchor.fromCursor);
    const to = getCursorPositionSafely(doc, path, anchor.toCursor);

    // if the anchor points to an empty range return undefined
    // so highlight comments that point to this will be filtered out
    if (from === to) {
      return undefined;
    }

    return get(doc, path).slice(from, to);
  },

  doAnchorsOverlap: (doc: D, anchor1: TextAnchor, anchor2: TextAnchor) => {
    const from1 = getCursorPositionSafely(doc, path, anchor1.fromCursor);
    const to1 = getCursorPositionSafely(doc, path, anchor1.toCursor);
    const from2 = getCursorPositionSafely(doc, path, anchor2.fromCursor);
    const to2 = getCursorPositionSafely(doc, path, anchor2.toCursor);

    if (from1 === null || to1 === null || from2 === null || to2 === null) {
      // TODO: JAH strict fix
      return false;
    }

    return Math.max(from1, from2) <= Math.min(to1, to2);
  },

  sortAnchorsBy: (doc: D, anchor: TextAnchor) => {
    // TODO: JAH strict fix... threw a -1 in there lol
    return getCursorPositionSafely(doc, path, anchor.fromCursor) || -1;
  },
});

const diffText = (
  before: string,
  after: string,
  doc: Automerge.Doc<unknown>,
  path: Automerge.Prop[],
  offset: number
): Annotation<TextAnchor, string>[] => {
  const annotations: Annotation<TextAnchor, string>[] = [];
  const parts = diffWords(before, after);
  for (let i = 0; i < parts.length; i++) {
    let deleted = "";
    let added = "";

    for (; i < parts.length; i++) {
      const part = parts[i];

      if (part.added) {
        added += part.value;
        offset += part.value.length;
      } else if (part.removed) {
        deleted += part.value;
      } else {
        if (part.value.trim() === "") {
          added += part.value;
          deleted += part.value;
          offset += part.value.length;
        } else if (deleted === "" && added === "") {
          offset += part.value.length;
        } else {
          i--;
          break;
        }
      }

      const nextPart = parts[i + 1];
      if (
        nextPart &&
        !nextPart.added &&
        !nextPart.removed &&
        nextPart.value.trim() !== ""
      ) {
        break;
      }
    }

    if (deleted.length > 0 && added.length > 0) {
      const anchor = {
        fromCursor: Automerge.getCursor(doc, path, offset - added.length),
        toCursor: Automerge.getCursor(doc, path, offset),
      };

      annotations.push({
        type: "changed",
        anchor,
        before: deleted,
        after: added,
        inversePatches: [
          {
            action: "del",
            path,
            cursor: anchor.fromCursor,
            length: added.length,
          },
          {
            action: "splice",
            path,
            cursor: anchor.fromCursor,
            value: deleted,
          },
        ],
      });
    } else if (deleted.length > 0) {
      const cursor = Automerge.getCursor(doc, path, offset);

      annotations.push({
        type: "deleted",
        anchor: {
          fromCursor: cursor,
          toCursor: cursor,
        },
        deleted,
        inversePatches: [
          {
            action: "splice",
            path,
            cursor,
            value: deleted,
          },
        ],
      });
    } else if (added.length > 0) {
      const anchor = {
        fromCursor: Automerge.getCursor(doc, path, offset - added.length),
        toCursor: Automerge.getCursor(doc, path, offset),
      };
      annotations.push({
        type: "added",
        anchor,
        added,
        inversePatches: [
          {
            action: "del",
            path,
            cursor: anchor.fromCursor,
            length: added.length,
          },
        ],
      });
    }
  }

  return annotations;
};
