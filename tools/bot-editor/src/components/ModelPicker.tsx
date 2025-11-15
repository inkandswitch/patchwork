import React from "react";
import { usePluginDescriptions } from "@patchwork/react";
import type { ModelId, LLMProviderDescription } from "../providers/types";

export const ModelPicker: React.FC<{
  modelId: ModelId;
  onChange: (modelId: ModelId) => void;
}> = ({ modelId, onChange }) => {
  const modelProviders = usePluginDescriptions<LLMProviderDescription>(
    "patchwork:llm-provider"
  );
  const models = modelProviders.flatMap((p) => p.supportedModels || []);

  return (
    <select
      className="select select-bordered select-xs w-[120px]"
      value={modelId}
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
