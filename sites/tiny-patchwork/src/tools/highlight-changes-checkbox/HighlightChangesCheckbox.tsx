import { Ref } from "@patchwork/context";
import { computeDiffOfDoc, ViewHeadsAnnotation } from "@patchwork/context/diff";
import { useReactive, useSubcontext } from "@patchwork/context/react";
import { $selectedDocRefs } from "@patchwork/context/selection";
import { useEffect, useMemo, useState } from "react";

export const HighlightChangesOption = () => {
  const selectedDocRefs = useReactive($selectedDocRefs);
  const [highlightChanges, setHighlightChanges] = useState(false);

  // Compute diffs when on a branch with highlight changes enabled
  const diffsOfSelectedDocs = useMemo<Ref[]>(() => {
    if (!highlightChanges) {
      return [];
    }

    return selectedDocRefs.flatMap((ref) => {
      const viewHeads = ref.get(ViewHeadsAnnotation);

      if (!viewHeads) {
        return [];
      }

      const beforeHeads = viewHeads.beforeHeads;
      return computeDiffOfDoc(ref.docHandle, beforeHeads);
    });
  }, [highlightChanges, selectedDocRefs]);

  const diffSubcontext = useSubcontext("HIGHLIGHT_CHANGES");
  useEffect(() => {
    diffSubcontext.replace(diffsOfSelectedDocs);
  }, [diffsOfSelectedDocs, diffSubcontext]);

  return (
    <label className="label text-sm flex items-center">
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
