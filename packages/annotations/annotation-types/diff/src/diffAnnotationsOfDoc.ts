import { DocHandle } from "@automerge/automerge-repo";
import { Automerge } from "@automerge/automerge-repo/slim";
import { AnnotationSet } from "@inkandswitch/annotations";
import { last, lookup } from "./utils";
import { cursor, ref } from "@patchwork/refs";
import { Diff } from "./types";

/**
 * Computes the diff between document states and returns an AnnotationSet.
 *
 * The returned AnnotationSet can be directly added to the global context:
 *
 * @param docHandle - The document handle to diff
 * @param headsBefore - The heads representing the "before" state
 * @returns An AnnotationSet containing diff annotations, or undefined if inputs are invalid
 */
export function diffAnnotationsOfDoc(
  docHandle: DocHandle<unknown>,
  headsBefore: Automerge.Heads
): AnnotationSet {
  const annotations = new AnnotationSet();

  const docBefore = Automerge.view(docHandle.doc(), headsBefore);
  const docAfter = docHandle.doc();

  const patches = Automerge.diff(
    docAfter,
    headsBefore,
    Automerge.getHeads(docAfter)
  );

  // Track which ancestor paths we've marked as modified during this pass
  const modifiedPaths = new Set<string>();

  // Track offset per path for mapping patch positions to original positions
  // Patches are ordered by position, so we can use a simple offset:
  // - After deletion: offset += length (positions shift left, need to add to get original)
  // - After insertion: offset -= length (positions shift right, need to subtract to get original)
  const offsetByPath = new Map<string, number>();

  for (const patch of patches) {
    const ancestorPath =
      typeof last(patch.path) === "number"
        ? patch.path.slice(0, -1)
        : patch.path;

    // First, ensure ancestors are marked as modified incrementally.
    for (let i = ancestorPath.length; i > 0; i--) {
      const ancestorSubPath = ancestorPath.slice(0, i);
      const key = JSON.stringify(ancestorSubPath);
      if (modifiedPaths.has(key)) break;

      const ancestorRef = ref(docHandle, ...ancestorSubPath);
      const before = lookup(docBefore, ancestorSubPath);

      if (before) {
        annotations.add(ancestorRef, Diff({ type: "changed", before }));
      } else {
        annotations.add(ancestorRef, Diff({ type: "added" }));
      }

      modifiedPaths.add(key);
    }

    // Then add leaf annotations for the specific patch
    const objRef = ref(docHandle, ...patch.path);

    switch (patch.action) {
      case "put":
        annotations.add(objRef, Diff({ type: "added" }));
        break;

      case "del": {
        // is this a span deletion?
        if (typeof last(patch.path) === "number") {
          const parentPath = patch.path.slice(0, -1);
          const parent = lookup(docBefore, parentPath);

          // for text, create deletion annotation
          if (typeof parent === "string") {
            const patchPosition = last(patch.path) as number;
            const length = (patch as { length?: number }).length ?? 1;
            const key = JSON.stringify(parentPath);

            // Get current offset for this path
            const offset = offsetByPath.get(key) ?? 0;

            // Map to original position for text extraction
            const originalPosition = patchPosition + offset;
            const deletedText = parent.substring(
              originalPosition,
              originalPosition + length
            );

            // Marker position = patch position (patches are ordered, so this is the current doc position)
            const textSpanRef = ref(
              docHandle,
              ...parentPath,
              cursor(patchPosition, patchPosition)
            );

            annotations.add(
              textSpanRef,
              Diff({ type: "deleted", before: deletedText })
            );

            // Update offset for subsequent patches
            offsetByPath.set(key, offset + length);

            // for arrays mark the individual objects in the range as deleted
          } else if (Array.isArray(parent)) {
            throw new Error("not implemented");
          } else {
            throw new Error("Unexpected value, this should never happen");
          }

          // ... otherwise this is a deletion of a key in an object
        } else {
          const before = lookup(docBefore, patch.path);
          annotations.add(objRef, Diff({ type: "deleted", before }));
        }
        break;
      }

      case "insert": {
        annotations.add(objRef, Diff({ type: "added" }));
        break;
      }

      case "splice": {
        const parentPath = patch.path.slice(0, -1);
        const patchPosition = last(patch.path) as number;
        const length = patch.value.length;
        const key = JSON.stringify(parentPath);

        // Get current offset for this path
        const offset = offsetByPath.get(key) ?? 0;

        // Annotation position = patch position (patches are ordered)
        const textSpanRef = ref(
          docHandle,
          ...parentPath,
          cursor(patchPosition, patchPosition + length)
        );

        annotations.add(textSpanRef, Diff({ type: "added" }));

        // Update offset for subsequent patches
        offsetByPath.set(key, offset - length);
        break;
      }
    }
  }

  return annotations;
}
