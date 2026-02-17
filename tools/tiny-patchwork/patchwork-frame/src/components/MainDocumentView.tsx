import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { Accessor } from "solid-js";
import { Show } from "solid-js";

interface MainDocumentViewProps {
  viewKey: Accessor<string | undefined>;
  selectedDocUrl: Accessor<AutomergeUrl | undefined>;
  toolId: Accessor<string | undefined>;
}

/**
 * Renders the main document view with proper keying for remounting
 */
export function MainDocumentView({
  viewKey,
  selectedDocUrl,
  toolId,
}: MainDocumentViewProps) {
  return (
    <div class="w-full flex-1 min-h-0">
      <Show when={viewKey()} keyed>
        {(key) => {
          return (
            <patchwork-view doc-url={selectedDocUrl()!} tool-id={toolId()} />
          );
        }}
      </Show>
      {!selectedDocUrl() && (
        <div class="flex items-center justify-center h-full text-base-content">
          Select a document in the sidebar
        </div>
      )}
    </div>
  );
}
