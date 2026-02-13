import type { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { For } from "solid-js";
import { $selectedDocUrls } from "@inkandswitch/annotations-selection";
import { useSubscribe } from "@inkandswitch/subscribables-solid";
import { DocHistoryView } from "./components/DocHistoryView";
import "./styles.css";

export interface PatchworkToolProps<T> {
  repo: Repo;
}

/**
 * Main timeline component that renders history views for all selected documents
 */
export function HistoryTimeline(props: PatchworkToolProps<any>) {
  const selectedDocUrls = useSubscribe($selectedDocUrls);

  return (
    <div class="flex flex-col h-full">
      <For each={selectedDocUrls()}>
        {(url) => (
          <DocHistoryView url={url as AutomergeUrl} repo={props.repo} />
        )}
      </For>
    </div>
  );
}
