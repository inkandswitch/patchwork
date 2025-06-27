import { Tool } from "@patchwork/sdk";
import { useMatchingPluginDescriptions, usePlugin } from "@patchwork/sdk/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Hook to manage tool selection in the Explorer, handling both user-selected tools
 * and automatic fallback selection.
 *
 * Subtle loading behavior:
 * The hook handles a tricky race condition where tools load gradually:
 * 1. Tools are loaded asynchronously and may arrive in any order
 * 2. Each time a new tool arrives, useMatchingPluginDescriptions returns a new sorted list
 * 3. Without careful handling, this could cause undesirable tool behavior:
 *    - Tool A loads first → becomes default selection
 *    - Without proper handling, we'd get stuck with A even if better tools load later
 *    - Instead, we dynamically update to the best available tool until user makes a choice
 *
 * Our solution:
 * - Let the UI reflect the current best default (may flicker briefly while tools load)
 * - Once user makes an explicit selection, stick with it (unless tool becomes unavailable)
 * - Reset to default behavior when switching documents
 *
 * QA testing:
 * 1. Tool loading order:
 *    - Open a document when tools load in different orders
 *    - Verify UI shows first available tool, updates as more load
 *    - Once stable, verify first tool in sorted list is selected
 * 2. User selection:
 *    - Select a specific tool
 *    - Verify selection persists even if tool list updates
 *    - Verify selection clears when switching to a different document
 *
 * @param selectedDataTypeId - The ID of the currently selected data type
 * @param selectedDocUrl - The URL of the currently selected document
 * @returns An object containing:
 *   - currentToolId: The ID of the currently selected tool (always available even when tool is loading)
 *   - currentTool: The actual tool object (may be undefined while loading)
 *   - isLoadingTool: Whether the tool is currently loading
 *   - error: Any error that occurred while loading the tool
 *   - handleToolChange: Function to change the selected tool
 *   - toolDescriptions: List of available tool descriptions
 *
 * Note: We return the ID and tool separately because the ID represents the desired selection
 * that's immediately available, while the actual tool object may be in a loading or error state.
 */
export const useSelectedTool = (
  selectedDataTypeId: string | undefined,
  selectedDocUrl: string | undefined
) => {
  // Get all tools compatible with the current datatype
  const { plugins: toolDescriptions } = useMatchingPluginDescriptions<Tool>({
    pluginType: "patchwork:tool",
    matchField: "supportedDataTypes",
    matchValue: selectedDataTypeId,
    sortField: "name",
  });

  // Only track user selections in state.
  const [userSelectedToolId, setUserSelectedToolId] = useState<string | null>(
    null
  );

  // Whenever the document or datatype changes, clear any prior user choice so the
  // fallback logic (first tool in list) runs again.
  useEffect(() => {
    setUserSelectedToolId(null);
  }, [selectedDataTypeId, selectedDocUrl]);

  // Determine which tool ID should be active right now. If the user has
  // explicitly selected a tool and it remains available, use it; otherwise
  // fall back to the first compatible tool.
  const currentToolId = useMemo(() => {
    if (
      userSelectedToolId &&
      toolDescriptions.some((t) => t.id === userSelectedToolId)
    ) {
      return userSelectedToolId;
    }
    return toolDescriptions.length > 0 ? toolDescriptions[0].id : "";
  }, [userSelectedToolId, toolDescriptions]);

  const {
    plugin: currentTool,
    isLoading: isLoadingTool,
    error,
  } = usePlugin<Tool>("patchwork:tool", currentToolId);

  // Expose a handler for user-initiated tool changes.
  const handleToolChange = useCallback(
    (toolId: string) => {
      const newTool = toolDescriptions.find((t) => t.id === toolId);
      if (newTool) {
        setUserSelectedToolId(toolId);
      }
    },
    [toolDescriptions]
  );

  return {
    currentTool,
    currentToolId,
    isLoadingTool,
    handleToolChange,
    toolDescriptions,
    error,
  } as const;
};

export type UseSelectedToolResult = ReturnType<typeof useSelectedTool>;
