import { useCallback, useEffect, useMemo, useState } from "react";
import { usePluginDescriptions } from "@patchwork/react";
import type { LoadedPlugin, PluginDescription } from "@patchwork/plugins";
import { getRegistry } from "@patchwork/plugins";

// AIEditPrompt types
interface AIEditPromptDescription extends PluginDescription {
  type: "patchwork:ai-prompt";
  datatypeId: string | "*";
}

interface AIEditPromptImplementation<D = unknown> {
  docToText?: (doc: D) => string;
  textToDoc?: (text: string) => D;
  prompt: string;
  edit: (handle: any, newContent: any, repo: any) => Promise<void>;
}

export type AIEditPrompt = LoadedPlugin<
  AIEditPromptDescription,
  AIEditPromptImplementation
>;

export type DataType = {
  id: string;
  name: string;
};

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
  // Get all AI prompt plugins
  const allPrompts = usePluginDescriptions<
    AIEditPromptDescription,
    AIEditPromptImplementation
  >("patchwork:ai-prompt");

  // State to hold loaded prompts
  const [loadedPrompts, setLoadedPrompts] = useState<AIEditPrompt[]>([]);

  // Load plugins when they change
  useEffect(() => {
    const loadPrompts = async () => {
      const registry = getRegistry<AIEditPromptDescription>(
        "patchwork:ai-prompt"
      );
      const loaded: AIEditPrompt[] = [];

      for (const prompt of allPrompts) {
        try {
          const loadedPlugin = await registry.load(prompt.id);
          if (loadedPlugin && "module" in loadedPlugin) {
            loaded.push(loadedPlugin as AIEditPrompt);
          }
        } catch (error) {
          console.error(`Failed to load prompt ${prompt.id}:`, error);
        }
      }

      setLoadedPrompts(loaded);
    };

    loadPrompts();
  }, [allPrompts]);

  // Filter prompts compatible with the current datatype
  const prompts = useMemo(() => {
    if (!dataType?.id) return loadedPrompts;

    return loadedPrompts
      .filter((prompt) => {
        // Match either the specific datatype or wildcard
        return prompt.datatypeId === dataType.id || prompt.datatypeId === "*";
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [loadedPrompts, dataType?.id]);

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
