import { createSignal } from "solid-js";
import type { ViewHeadsType, HistoryGroup } from "../../types";

/**
 * Hook to manage history selection state
 * Handles selecting groups of changes (which may contain 1 or more changes)
 */
export function useHistorySelection() {
  const [viewHeads, setViewHeads] = createSignal<ViewHeadsType | null>(null);

  /**
   * Select a history item (a group of 1 or more changes)
   * Shows cumulative diff for all changes in the group
   *
   * beforeHeads: the state before the change(s) were applied
   * afterHeads: the state after the change(s) were applied
   */
  const selectItem = (item: HistoryGroup) => {
    const beforeHeads = item.beforeHead ? [item.beforeHead] : [];
    const afterHeads = [item.afterHead];

    setViewHeads({
      beforeHeads,
      afterHeads,
    });
  };

  /**
   * Clear the selection and return to the current state
   */
  const clearSelection = () => {
    setViewHeads(null);
  };

  return {
    viewHeads,
    selectItem,
    clearSelection,
  };
}
