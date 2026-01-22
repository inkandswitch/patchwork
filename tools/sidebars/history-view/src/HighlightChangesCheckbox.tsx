import { useDocuments } from "@automerge/automerge-repo-react-hooks";
import {
  decodeHeads,
  parseAutomergeUrl,
  encodeHeads,
} from "@automerge/automerge-repo/slim";
import { AnnotationSet } from "@inkandswitch/annotations";
import {
  annotations,
  annotations as globalAnnotations,
} from "@inkandswitch/annotations-context";
import {
  diffAnnotationsOfDoc,
  ViewHeads,
} from "@inkandswitch/annotations-diff";
import { $selectedRefs } from "@inkandswitch/annotations-selection";
import { useSubscribe } from "@inkandswitch/subscribables-react";
import { useEffect, useMemo, useState } from "react";
import "./styles.css";

export const HighlightChangesOption = () => {
  const selectedRefs = useSubscribe($selectedRefs);
  const viewHeadAnnotations = useSubscribe(annotations.ofType(ViewHeads));
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

    // Collect all diff sets first (outside of change block)
    const diffSets: AnnotationSet[] = [];

    if (highlightChanges) {
      for (const ref of selectedRefs) {
        const viewHeads = viewHeadAnnotations.lookup(ref);
        let beforeHeads = viewHeads?.beforeHeads;
        const afterHeads = viewHeads?.afterHeads;

        if (!beforeHeads) {
          // Fall back to copyOf metadata
          const originalDocUrl = (ref.value() as any)?.["@patchwork"]?.copyOf;

          if (!originalDocUrl) {
            continue;
          }

          beforeHeads = decodeHeads(parseAutomergeUrl(originalDocUrl).heads!);
        }

        const diffSet = diffAnnotationsOfDoc(
          afterHeads
            ? ref.docHandle.view(encodeHeads(afterHeads))
            : ref.docHandle,
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
  }, [
    highlightChanges,
    selectedRefs,
    selectedDocs,
    diffAnnotations,
    viewHeadAnnotations,
  ]);

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
