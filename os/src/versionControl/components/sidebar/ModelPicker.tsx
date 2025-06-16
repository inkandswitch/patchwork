import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@patchwork/sdk/ui";
import { ModelId, LLMProviderDescription } from "@patchwork/sdk/llm";
import { usePluginDescriptions } from "@patchwork/sdk/hooks";
import { Plugin } from "@patchwork/sdk";

export const ModelPicker: React.FC<{
  modelId: ModelId;
  onChange: (modelId: ModelId) => void;
}> = ({ modelId, onChange }) => {
  const modelProviders = usePluginDescriptions<Plugin<LLMProviderDescription>>(
    "patchwork:llm-provider"
  );
  const models = modelProviders.flatMap((p) => p.supportedModels);

  return (
    <Select value={modelId} onValueChange={onChange}>
      <SelectTrigger className="h-6 w-[120px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {models.map((id: ModelId) => (
          <SelectItem key={id} value={id}>
            {id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
