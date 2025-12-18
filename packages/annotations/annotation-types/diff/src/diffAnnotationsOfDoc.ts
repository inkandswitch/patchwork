import { DocHandle } from "@automerge/automerge-repo";
import { Automerge } from "@automerge/automerge-repo/slim";
import { AnnotationSet } from "@inkandswitch/annotations";
import { last, lookup } from "./utils";
import { ref } from "@patchwork/refs";
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

          // for text mark the span as deleted
          if (typeof parent === "string") {
            const position = last(patch.path) as number;
            // Create a text range ref [from, to]
            const textSpanRef = ref(docHandle, ...parentPath, [
              position,
              position,
            ]);

            // todo: implement proper before text extraction
            const before = "";

            annotations.add(textSpanRef, Diff({ type: "deleted", before }));

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
        const from = last(patch.path) as number;
        const to = from + patch.value.length;
        // Create a text range ref
        const textSpanRef = ref(docHandle, ...parentPath, [from, to]);

        annotations.add(textSpanRef, Diff({ type: "added" }));
        break;
      }
    }
  }

  return annotations;
}
