import type { AutomergeUrl, Repo, DocHandle } from "@automerge/automerge-repo";
import { createMemo, For } from "solid-js";
import { $selectedDocUrls } from "@inkandswitch/annotations-selection";
import { useSubscribe } from "@inkandswitch/subscribables-solid";
import { makeDocumentProjection } from "@automerge/automerge-repo-solid-primitives";
import { DocHistoryView } from "./components/DocHistoryView";
import type { TinyPatchworkAccountDoc } from "../types";
import "../styles.css";

export interface PatchworkToolProps {
  handle: DocHandle<TinyPatchworkAccountDoc>;
  repo: Repo;
}

/**
 * Main timeline component that renders history views for all selected documents
 */
export function HistoryTimeline<T>(props: PatchworkToolProps) {
  const selectedDocUrls = useSubscribe($selectedDocUrls);

  const accountDoc = createMemo(() =>
    makeDocumentProjection(props.handle)
  );

  const taskQueueUrl = createMemo<AutomergeUrl | undefined>(() => {
    const doc = accountDoc();
    if (!doc) return undefined;
    const queues = doc["__taskQueues__"];
    if (!queues) return undefined;
    const url = (Object.keys(queues) as AutomergeUrl[]).find(
      (key) => queues[key] === true
    );
    return url;
  });

  return (
    <div class="flex flex-col h-full">
      <For each={selectedDocUrls()}>
        {(url) => (
          <DocHistoryView
            url={url as AutomergeUrl}
            repo={props.repo}
            taskQueueUrl={taskQueueUrl}
          />
        )}
      </For>
    </div>
  );
}
