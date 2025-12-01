import "./styles.css";
import { useDocuments } from "@automerge/automerge-repo-react-hooks";
import { decodeHeads, parseAutomergeUrl } from "@automerge/automerge-repo/slim";
import { Ref } from "@patchwork/context";
import { computeDiffOfDoc, ViewHeadsAnnotation } from "@patchwork/context-diff";
import { useReactive, useSubcontext } from "@patchwork/context-react";
import { $selectedDocRefs } from "@patchwork/context-selection";
import { useEffect, useMemo, useState } from "react";

export const HighlightChangesOption = () => {
  const selectedDocRefs = useReactive($selectedDocRefs);
  const selectedDocs = useDocuments(
    useMemo(() => selectedDocRefs.map((ref) => ref.docUrl), [selectedDocRefs])
  );
  const [highlightChanges, setHighlightChanges] = useState(false);

  // Compute diffs when on a branch with highlight changes enabled
  const diffsOfSelectedDocs = useMemo<Ref[]>(() => {
    // we need to rerun the diffs when the selected docs change
    void selectedDocs;

    if (!highlightChanges) {
      return [];
    }

    return selectedDocRefs.flatMap((ref) => {
      let beforeHeads = ref.get(ViewHeadsAnnotation)?.beforeHeads;

      if (!beforeHeads) {
        const originalDocUrl = ref.value?.["@patchwork"]?.copyOf;

        if (!originalDocUrl) {
          return [];
        }

        beforeHeads = decodeHeads(parseAutomergeUrl(originalDocUrl).heads!);
      }

      return computeDiffOfDoc(ref.docHandle, beforeHeads);
    });
  }, [highlightChanges, selectedDocRefs, selectedDocs]);

  const diffSubcontext = useSubcontext("HIGHLIGHT_CHANGES");
  useEffect(() => {
    diffSubcontext.replace(diffsOfSelectedDocs);
  }, [diffsOfSelectedDocs, diffSubcontext]);

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
