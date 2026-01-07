import "./styles.css";
import { useDocuments } from "@automerge/automerge-repo-react-hooks";
import { decodeHeads, parseAutomergeUrl } from "@automerge/automerge-repo/slim";
import { useEffect, useMemo, useState } from "react";
import { AnnotationSet } from "@inkandswitch/annotations";
import { annotations as globalAnnotations } from "@inkandswitch/annotations-context";
import {
  diffAnnotationsOfDoc,
  ViewHeads,
} from "@inkandswitch/annotations-diff";
import { $selectedRefs } from "@inkandswitch/annotations-selection";
import { useSubscribe } from "@inkandswitch/subscribables-react";

export const HighlightChangesOption = () => {
  const selectedRefs = useSubscribe($selectedRefs);
  const selectedDocs = useDocuments(
    useMemo(() => selectedRefs.map((ref) => ref.docHandle.url), [selectedRefs])
  );
  const [highlightChanges, setHighlightChanges] = useState(true);

  // Local annotation set for diff highlights
  const diffAnnotations = useMemo(() => new AnnotationSet(), []);

  // Register/unregister with global annotations
  useEffect(() => {
    globalAnnotations.add(diffAnnotations);
    return () => {
      globalAnnotations.remove(diffAnnotations);
    };
  }, [diffAnnotations]);

  // Compute and publish diffs when on a branch with highlight changes enabled
  useEffect(() => {
    // We need to rerun the diffs when the selected docs change
    void selectedDocs;

    // Defer the update to avoid triggering re-renders during React's commit phase
    setTimeout(() => {
      // Collect all diff sets first (outside of change block)
      const diffSets: AnnotationSet[] = [];

      if (highlightChanges) {
        for (const selectedRef of selectedRefs) {
          // Check for ViewHeads annotation first
          let beforeHeads: string[] | undefined;

          // Look for ViewHeads annotation on this ref
          for (const [ref, annotation] of globalAnnotations.entriesOfType(
            ViewHeads
          )) {
            if (ref.url === selectedRef.url) {
              beforeHeads = annotation.value.beforeHeads;
              break;
            }
          }

          if (!beforeHeads) {
            // Fall back to copyOf metadata
            const originalDocUrl = (selectedRef.value() as any)?.["@patchwork"]
              ?.copyOf;

            if (!originalDocUrl) {
              continue;
            }

            beforeHeads = decodeHeads(parseAutomergeUrl(originalDocUrl).heads!);
          }

          const diffSet = diffAnnotationsOfDoc(
            selectedRef.docHandle,
            beforeHeads
          );
          diffSets.push(diffSet);
        }
      }

      // Batch clear and add operations to emit only one change event
      diffAnnotations.change(() => {
        diffAnnotations.clear();
        for (const diffSet of diffSets) {
          diffAnnotations.add(diffSet);
        }
      });
    });
  }, [highlightChanges, selectedRefs, selectedDocs, diffAnnotations]);

  return (
    <label className="label text-sm flex items-center h-full min-w-0 w-fit">
      <input
        type="checkbox"
        className="checkbox checkbox-sm"
        checked={highlightChanges}
        onChange={(e) => {
          setHighlightChanges(e.target.checked);
        }}
      />
      Highlight changes
    </label>
  );
};
