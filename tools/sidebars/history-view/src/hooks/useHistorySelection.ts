import { createSignal } from "solid-js";
import type { ViewHeadsType, HistoryItem } from "../types";
import { isHistoryChange, isHistoryGroup } from "../types";

/**
 * Hook to manage history selection state
 * Handles selecting both individual changes and groups of changes
 */
export function useHistorySelection() {
  const [viewHeads, setViewHeads] = createSignal<ViewHeadsType | null>(null);

  /**
   * Select a history item (either a single change or a group)
   * For single changes: shows diff for that one change
   * For groups: shows cumulative diff for all changes in the group
   *
   * beforeHeads: the state before the change(s) were applied
   * afterHeads: the state after the change(s) were applied
   */
  const selectItem = (item: HistoryItem) => {

    if (isHistoryChange(item)) {
      // Single change selection
      const beforeHeads = item.beforeHead ? [item.beforeHead] : [];
      const afterHeads = [item.hash];

      setViewHeads({
        beforeHeads,
        afterHeads,
      });
    } else if (isHistoryGroup(item)) {
      // Group selection - show cumulative diff for entire group
      if (item.changes.length === 0) {
        console.warn("Empty group encountered");
        return;
      }

      // Newest change in group
      const firstChange = item.changes[0];
      // Find the change immediately before this group (if any)
      const beforeHeads = item.beforeHead ? [item.beforeHead] : [];
      const afterHeads = [firstChange.hash];

      setViewHeads({
        beforeHeads,
        afterHeads,
      });
    }
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
