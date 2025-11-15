import React from "react";
import type { LoadedPlugin, PluginDescription } from "@patchwork/plugins";

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

type AIEditPrompt = LoadedPlugin<
  AIEditPromptDescription,
  AIEditPromptImplementation
>;

interface PromptPickerProps {
  prompts: AIEditPrompt[];
  currentPrompt: AIEditPrompt | undefined;
  onChange: (promptId: string) => void;
}

export const PromptPicker: React.FC<PromptPickerProps> = ({
  prompts,
  currentPrompt,
  onChange,
}) => {
  return (
    <select
      className="select select-bordered select-xs w-[120px]"
      value={currentPrompt?.id || ""}
      onChange={(e) => onChange(e.target.value)}
    >
      {!currentPrompt && (
        <option value="" disabled>
          Select prompt
        </option>
      )}
      {prompts.map((prompt) => (
        <option key={prompt.id} value={prompt.id}>
          {prompt.name}
        </option>
      ))}
    </select>
  );
};
