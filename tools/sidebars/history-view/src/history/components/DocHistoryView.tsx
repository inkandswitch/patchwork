import type { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { createMemo, Show } from "solid-js";
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
import { HistoryComputingIndicator } from "./HistoryComputingIndicator";
// TODO: re-enable when we have more grouping strategies to choose from
// import { GroupingSelector } from "./GroupingSelector";

export interface DocHistoryViewProps {
  url: AutomergeUrl;
  repo: Repo;
}

// Only one grouping strategy is wired up today. When the selector UI is
// restored, turn this back into a signal and pass the setter to it.
const STRATEGY_CONFIG: GroupingStrategyConfig = { name: "timeWindow" };
const strategyConfig = () => STRATEGY_CONFIG;

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

  // Unified hook that manages history grouping with optimized updates
  const { items: groupedItems, isInitializing } = useCachedHistory(
    handle,
    strategyConfig,
    props.repo
  );

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
      {/* TODO: actor id was a stand-in for author, but we're waiting for keyhive to do it properly */}
      {/* <div class="px-2 pb-2">
        <GroupingSelector
          selectedConfig={strategyConfig()}
          onConfigChange={(cfg) => { STRATEGY_CONFIG = cfg; }}
        />
      </div> */}
      <Show
        when={!isInitializing()}
        fallback={<HistoryComputingIndicator />}
      >
        <HistoryList
          items={groupedItems()}
          selectedItem={selectedItem()}
          onSelectItem={selectItem}
        />
      </Show>
    </div>
  );
}
