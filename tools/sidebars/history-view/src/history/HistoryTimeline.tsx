import type { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { For } from "solid-js";
import { $selectedDocUrls } from "@inkandswitch/annotations-selection";
import { useSubscribe } from "@inkandswitch/subscribables-solid";
import { DocHistoryView } from "./components/DocHistoryView";
import "../styles.css";

export interface PatchworkToolProps {
  repo: Repo;
}

/**
 * Main timeline component that renders history views for all selected
 * documents. When only a single doc is selected its title is redundant (the
 * surrounding UI already shows it), so we hide the per-doc title header in
 * that case and only render per-doc titles when multiple docs are selected.
 */
export function HistoryTimeline(props: PatchworkToolProps) {
  const selectedDocUrls = useSubscribe($selectedDocUrls);
  const showTitle = () => selectedDocUrls().length > 1;

  return (
    <div class="flex flex-col h-full">
      <For each={selectedDocUrls()}>
        {(url) => (
          <DocHistoryView
            url={url as AutomergeUrl}
            repo={props.repo}
            showTitle={showTitle}
          />
        )}
      </For>
    </div>
  );
}
