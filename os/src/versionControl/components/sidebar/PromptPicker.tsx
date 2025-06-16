import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@patchwork/sdk/ui";
import { AIEditPrompt } from "@patchwork/sdk";

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
    <Select value={currentPrompt?.id} onValueChange={onChange}>
      <SelectTrigger className="h-6 w-[120px] text-xs">
        <SelectValue placeholder="Select prompt" />
      </SelectTrigger>
      <SelectContent>
        {prompts.map((prompt) => (
          <SelectItem key={prompt.id} value={prompt.id}>
            {prompt.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
