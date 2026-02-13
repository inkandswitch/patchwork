import {
  decodeHeads,
  parseAutomergeUrl,
  encodeHeads,
  AutomergeUrl,
  Repo,
} from "@automerge/automerge-repo/slim";
import { AnnotationSet } from "@inkandswitch/annotations";
import { annotations } from "@inkandswitch/annotations-context";
import {
  diffAnnotationsOfDoc,
  ViewHeads,
} from "@inkandswitch/annotations-diff";
import { $selectedRefs } from "@inkandswitch/annotations-selection";
import { useSubscribe } from "@inkandswitch/subscribables-solid";
import { createSignal, createEffect, onCleanup } from "solid-js";
import { useDocuments } from "./hooks/useDocuments";
import "./styles.css";

const PATCHWORK_HIGHLIGHT_CHANGES = "PATCHWORK_HIGHLIGHT_CHANGES";

export function HighlightChangesOption(props: { repo: Repo }) {
  const selectedRefs = useSubscribe($selectedRefs);
  const viewHeadAnnotations = useSubscribe(annotations.ofType(ViewHeads));
  const [selectedDocsMap] = useDocuments(
    () => selectedRefs().map((ref) => ref.docHandle.url as AutomergeUrl),
    props.repo
  );
  const [highlightChanges, setHighlightChanges] = createSignal(
    localStorage.getItem(PATCHWORK_HIGHLIGHT_CHANGES) !== "false"
  );

  // Local annotation set for diff highlights
  const diffAnnotations = new AnnotationSet();

  // Register/unregister with global annotations
  annotations.add(diffAnnotations);
  onCleanup(() => {
    annotations.remove(diffAnnotations);
  });

  // Compute and publish diffs when on a branch with highlight changes enabled
  createEffect(() => {
    // We need to rerun the diffs when the selected docs change
    void selectedDocsMap();

    // Collect all diff sets first (outside of change block)
    const diffSets: AnnotationSet[] = [];

    if (highlightChanges()) {
      for (const ref of selectedRefs()) {
        const viewHeads = viewHeadAnnotations().lookup(ref);
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
  });

  return (
    <label class="label text-sm flex items-center h-full min-w-0 w-fit">
      <input
        type="checkbox"
        class="checkbox checkbox-sm"
        checked={highlightChanges()}
        onChange={(e) => {
          const checked = e.currentTarget.checked;
          setHighlightChanges(checked);
          localStorage.setItem(PATCHWORK_HIGHLIGHT_CHANGES, String(checked));
        }}
      />
      Highlight changes
    </label>
  );
}
