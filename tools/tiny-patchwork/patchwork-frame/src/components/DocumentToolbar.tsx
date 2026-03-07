import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { Accessor } from "solid-js";
import { Show } from "solid-js";

interface DocumentToolbarProps {
  toolIds: Accessor<string[] | undefined>;
  docUrl: Accessor<AutomergeUrl | undefined>;
}

export function DocumentToolbar(props: DocumentToolbarProps) {
  return (
    <Show when={props.docUrl() && props.toolIds()} keyed>
      {(ids) => (
        <div class="p-2 bg-base-200 border-b border-base-300 flex items-center gap-2 flex-start">
          {ids.map((toolId) => (
            <patchwork-view
              class="w-fit! h-8! overflow-hidden! flex!"
              doc-url={props.docUrl()!}
              tool-id={toolId}
            />
          ))}
        </div>
      )}
    </Show>
  );
}
