import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { Accessor } from "solid-js";
import { For, Show } from "solid-js";

interface DocumentToolbarProps {
  toolIds?: string[];
  docUrl: Accessor<AutomergeUrl | undefined>;
}

/**
 * Renders the document toolbar with configured tools.
 * Props are accessed via `props.x` (not destructured) to preserve Solid reactivity.
 */
export function DocumentToolbar(props: DocumentToolbarProps) {
  return (
    <Show when={props.docUrl() && props.toolIds && props.toolIds.length > 0}>
      <div class="p-2 bg-base-200 border-b border-base-300 flex items-center gap-2 flex-start">
        <For each={props.toolIds}>
          {(toolId) => (
            <patchwork-view
              class="w-fit! h-8! overflow-hidden! flex!"
              doc-url={props.docUrl()!}
              tool-id={toolId}
            />
          )}
        </For>
      </div>
    </Show>
  );
}
