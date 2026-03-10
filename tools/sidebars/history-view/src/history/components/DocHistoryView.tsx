import type { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { createSignal, createMemo } from "solid-js";
import { useDocument } from "@automerge/automerge-repo-solid-primitives";
import type { HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import {
  useDocumentMetadata,
  useHistorySelection,
  useViewHeadsAnnotation,
  useCachedHistory,
} from "../hooks";
import { type GroupingStrategyConfig, findItemByHash } from "../../types";
import { DocHistoryHeader } from "./DocHistoryHeader";
import { HistoryList } from "./HistoryList";
import { GroupingSelector } from "./GroupingSelector";

export interface DocHistoryViewProps {
  url: AutomergeUrl;
  repo: Repo;
}

/**
 * Orchestrator component that composes hooks and components
 * Minimal logic, mostly composition
 */
export function DocHistoryView(props: DocHistoryViewProps) {
  // Get document and handle
  const [doc, handle] = useDocument<HasPatchworkMetadata>(props.url, {
    repo: props.repo,
  });

  // Use hooks for different concerns
  const { title, docRef } = useDocumentMetadata(doc, handle);

  // Grouping strategy configuration
  const [strategyConfig, setStrategyConfig] =
    createSignal<GroupingStrategyConfig>({
      name: "timeWindow",
    });

  // Unified hook that manages history grouping with optimized updates
  const groupedItems = useCachedHistory(handle, strategyConfig, props.repo);

  // Selection hook
  const { viewHeads, selectItem, clearSelection } = useHistorySelection();

  // Manage annotations
  useViewHeadsAnnotation(viewHeads, docRef);

  // Compute selected item for UI highlighting
  const selectedItem = createMemo(() => {
    const heads = viewHeads();
    if (!heads) return null;

    const afterHash = heads.afterHeads[0];
    if (!afterHash) return null;

    // Find the item containing this hash
    // TODO: do this better - we should be able to directly track the selected item without searching through the list each time
    return findItemByHash(groupedItems(), afterHash);
  });

  return (
    <div class="flex flex-col flex-1 min-h-0">
      <DocHistoryHeader
        title={title()}
        hasSelection={viewHeads() !== null}
        onReset={clearSelection}
      />
      <div class="px-2 pb-2">
        <GroupingSelector
          selectedConfig={strategyConfig()}
          onConfigChange={setStrategyConfig}
        />
      </div>
      <HistoryList
        items={groupedItems()}
        selectedItem={selectedItem()}
        onSelectItem={selectItem}
      />
    </div>
  );
}
