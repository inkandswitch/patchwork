import { AIEditPrompt, DataType, getMatchingPlugins } from "@patchwork/sdk";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Hook to manage AI prompt selection, handling both user-selected prompts
 * and automatic fallback selection.
 *
 * Follows the same pattern as useSelectedTool:
 * - Let the UI reflect the current best default (may flicker briefly while prompts load)
 * - Once user makes an explicit selection, stick with it (unless prompt becomes unavailable)
 * - Reset to default behavior when switching documents/datatypes
 */
export const useSelectedPrompt = (dataType: DataType | undefined) => {
  // Get all prompts compatible with the current datatype
  const { plugins: prompts } = getMatchingPlugins<AIEditPrompt>({
    pluginType: "patchwork:ai-prompt",
    matchField: "datatypeId",
    matchValue: dataType?.id,
    sortField: "name",
  });

  // Only track user selections in state
  const [userSelectedPromptId, setUserSelectedPromptId] = useState<
    string | null
  >(null);

  // Whenever the datatype changes, clear any prior user choice so the
  // fallback logic (first prompt in list) runs again
  useEffect(() => {
    setUserSelectedPromptId(null);
  }, [dataType?.id]);

  // Determine which prompt ID should be active right now. If the user has
  // explicitly selected a prompt and it remains available, use it; otherwise
  // fall back to the first compatible prompt.
  const currentPromptId = useMemo(() => {
    if (
      userSelectedPromptId &&
      prompts.some((p) => p.id === userSelectedPromptId)
    ) {
      return userSelectedPromptId;
    }
    return prompts.length > 0 ? prompts[0].id : "";
  }, [userSelectedPromptId, prompts]);

  // Get the current prompt object
  const currentPrompt = useMemo(() => {
    return prompts.find((p) => p.id === currentPromptId);
  }, [currentPromptId, prompts]);

  // Expose a handler for user-initiated prompt changes
  const handlePromptChange = useCallback(
    (promptId: string) => {
      const newPrompt = prompts.find((p) => p.id === promptId);
      if (newPrompt) {
        setUserSelectedPromptId(promptId);
      }
    },
    [prompts]
  );

  return {
    currentPrompt,
    handlePromptChange,
    prompts,
  } as const;
};

export type UseSelectedPromptResult = ReturnType<typeof useSelectedPrompt>;
