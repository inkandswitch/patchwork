import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { Accessor } from "solid-js";
import { Show } from "solid-js";

interface DocumentToolbarProps {
  toolIds?: string[];
  docUrl: Accessor<AutomergeUrl | undefined>;
}

/**
 * Renders the document toolbar with configured tools
 */
export function DocumentToolbar({ toolIds, docUrl }: DocumentToolbarProps) {
  return (
    <Show when={docUrl() && toolIds && toolIds.length > 0}>
      <div class="p-2 bg-base-200 border-b border-base-300 flex items-center gap-2 flex-start">
        {toolIds!.map((toolId, index) => (
          <patchwork-view
            class="w-fit! h-8! overflow-hidden! flex!"
            doc-url={docUrl()!}
            tool-id={toolId}
            key={index}
          />
        ))}
      </div>
    </Show>
  );
}
