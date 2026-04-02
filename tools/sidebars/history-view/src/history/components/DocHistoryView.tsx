import type { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { createSignal, createMemo, Accessor } from "solid-js";
import { useDocument } from "@automerge/automerge-repo-solid-primitives";
import type { HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import {
  useDocumentMetadata,
  useHistorySelection,
  useViewHeadsAnnotation,
  useCachedHistory,
} from "../hooks";
import type { GroupingStrategyConfig } from "../../types";
import { applyGroupingStrategy } from "../utils";
import { DocHistoryHeader } from "./DocHistoryHeader";
import { HistoryList } from "./HistoryList";
import { GroupingSelector } from "./GroupingSelector";

export interface DocHistoryViewProps {
  url: AutomergeUrl;
  repo: Repo;
  taskQueueUrl: Accessor<AutomergeUrl | undefined>;
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

  // Get raw minute-keyed groupings from history document
  const rawGroupings = useCachedHistory(
    handle,
    props.repo,
    props.taskQueueUrl
  );

  // Apply grouping strategy as a derived memo — changing strategy only re-runs this
  const groupedItems = createMemo(() => {
    return applyGroupingStrategy(strategyConfig(), rawGroupings());
  });

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

    return groupedItems().find((g) => g.afterHead === afterHash) ?? null;
  });

  return (
    <div class="flex flex-col flex-1 min-h-0">
      <DocHistoryHeader
        title={title()}
        hasSelection={viewHeads() !== null}
        onReset={clearSelection}
      />
      {/* TODO: actor id was a stand-in for author, but we're waiting for keyhive to do it properly */}
      <div class="px-2 pb-2">
        <GroupingSelector
          selectedConfig={strategyConfig()}
          onConfigChange={setStrategyConfig}
        />
      </div>
      {groupedItems().length === 0 ? (
        props.taskQueueUrl() === undefined ? (
          "No task queues available for computing history groups"
        ) : (
          "Loading..."
        )
      ) : (
        <HistoryList
          items={groupedItems()}
          selectedItem={selectedItem()}
          onSelectItem={selectItem}
        />
      )}
    </div>
  );
}
