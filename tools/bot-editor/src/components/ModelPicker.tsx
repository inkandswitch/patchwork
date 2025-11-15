import React from "react";
import { usePluginDescriptions } from "@patchwork/react";
import type { ModelId, LLMProviderDescription } from "../providers/types";

export const ModelPicker: React.FC<{
  modelId: ModelId | undefined;
  onChange: (modelId: ModelId) => void;
}> = ({ modelId, onChange }) => {
  const modelProviders = usePluginDescriptions<LLMProviderDescription>(
    "patchwork:llm-provider"
  );
  const models = modelProviders.flatMap((p) => p.supportedModels || []);

  // Use first available model as default if none selected
  const selectedModel = modelId || models[0];

  return (
    <select
      className="select select-bordered select-xs w-[120px]"
      value={selectedModel}
      onChange={(e) => onChange(e.target.value as ModelId)}
    >
      {models.map((id: ModelId) => (
        <option key={id} value={id}>
          {id}
        </option>
      ))}
    </select>
  );
};
