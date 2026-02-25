import "./styles.css";
import { AutomergeUrl } from "@automerge/automerge-repo";
import {
  ToolElement,
  ToolDescription,
} from "@inkandswitch/patchwork-plugins";
import {
  watchToolForDocument,
  type ToolResolution,
} from "@inkandswitch/patchwork-elements";
import { getRegistry } from "@inkandswitch/patchwork-plugins";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useState, useCallback, useEffect, useRef } from "react";

export const ToolPicker = ({
  docUrl,
}: {
  docUrl: AutomergeUrl;
  element: ToolElement;
}) => {
  const repo = useRepo();
  const [resolution, setResolution] = useState<ToolResolution>({
    selectedTool: null,
    availableTools: [],
  });

  useEffect(() => {
    return watchToolForDocument(repo, docUrl, {}, (r) => setResolution(r));
  }, [repo, docUrl]);

  const selectedToolId = resolution.selectedTool?.id ?? null;
  const selectedTag = resolution.selectedTool?.tag ?? "default";

  const toolRegistry = useRef(getRegistry<ToolDescription>("patchwork:tool"));
  const tags = selectedToolId
    ? toolRegistry.current.getVersions(selectedToolId)
    : [];
  const filteredTags = tags.filter((v) => v.tag);

  const handleToolChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const toolId = e.target.value;
      const tool = resolution.availableTools.find((t) => t.id === toolId);
      if (tool) {
        setResolution((prev) => ({ ...prev, selectedTool: tool }));
      }
    },
    [resolution.availableTools]
  );

  const handleTagChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!selectedToolId) return;
      const desc = toolRegistry.current.getTag(
        selectedToolId,
        e.target.value
      );
      if (!desc?.importUrl) return;
      const importUrl = desc.importUrl;
      setResolution((prev) => ({
        ...prev,
        selectedTool: {
          id: desc.id,
          name: desc.name,
          importUrl,
          icon: desc.icon,
          tag: desc.tag,
          sourceDocUrl: desc.sourceDocUrl,
        },
      }));
    },
    [selectedToolId]
  );

  const { availableTools } = resolution;

  if (availableTools.length <= 1 && filteredTags.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 h-full">
      {availableTools.length > 1 && (
        <select
          className="select select-xs select-bordered h-6 min-h-0"
          value={selectedToolId ?? ""}
          onChange={handleToolChange}
        >
          {availableTools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tool.name}
            </option>
          ))}
        </select>
      )}
      {filteredTags.length > 1 && (
        <select
          className="select select-xs select-bordered h-6 min-h-0 text-xs opacity-70"
          value={selectedTag}
          onChange={handleTagChange}
        >
          {filteredTags.map((t) => (
            <option key={t.tag} value={t.tag}>
              {t.tag}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};
