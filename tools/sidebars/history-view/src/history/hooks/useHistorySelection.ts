import { createSignal } from "solid-js";
import type { ViewHeadsType, HistoryItem } from "../../types";

/**
 * Hook to manage history selection state.
 *
 * A selection produces a `ViewHeadsType`:
 * - `afterHeads` is the item's representative (newest) hash.
 * - `beforeHeads` is the hash immediately preceding the item in linear
 *   history, used to compute a cumulative diff for the whole item.
 */
export function useHistorySelection() {
  const [viewHeads, setViewHeads] = createSignal<ViewHeadsType | null>(null);

  const selectItem = (item: HistoryItem) => {
    if (item.count === 0) {
      console.warn("Empty history item encountered");
      return;
    }

    setViewHeads({
      beforeHeads: item.beforeHead ? [item.beforeHead] : [],
      afterHeads: [item.latestHash],
    });
  };

  const clearSelection = () => {
    setViewHeads(null);
  };

  return {
    viewHeads,
    selectItem,
    clearSelection,
  };
}
