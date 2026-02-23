import "./styles.css";
import { AutomergeUrl } from "@automerge/automerge-repo";
import {
  ToolElement,
  ToolDescription,
} from "@inkandswitch/patchwork-plugins";
import type { PatchworkToolPickerElement } from "@inkandswitch/patchwork-elements";
import { useState, useEffect, useRef, useCallback } from "react";

export const ToolPicker = ({
  docUrl,
  element,
}: {
  docUrl: AutomergeUrl;
  element: ToolElement;
}) => {
  const pickerRef = useRef<PatchworkToolPickerElement | null>(null);
  const [availableTools, setAvailableTools] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("default");
  const [branches, setBranches] = useState<ToolDescription[]>([]);

  useEffect(() => {
    const picker = document.createElement(
      "patchwork-tool-picker"
    ) as PatchworkToolPickerElement;
    picker.setAttribute("doc-url", docUrl);
    picker.style.display = "none";
    element.appendChild(picker);
    pickerRef.current = picker;

    const syncState = () => {
      const tools = picker.availableTools ?? [];
      const selected = picker.selectedTool;
      setAvailableTools(tools.map((t) => ({ id: t.id, name: t.name })));
      setSelectedToolId(selected?.id ?? null);
      setSelectedBranch(selected?.branch ?? "default");
      if (selected) {
        setBranches(picker.getBranchesForTool(selected.id));
      }
    };

    picker.addEventListener("patchwork:tool-selected", syncState);
    syncState();

    return () => {
      picker.removeEventListener("patchwork:tool-selected", syncState);
      picker.remove();
      pickerRef.current = null;
    };
  }, [docUrl, element]);

  const handleToolChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      pickerRef.current?.selectTool(e.target.value);
    },
    []
  );

  const handleBranchChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!selectedToolId) return;
      pickerRef.current?.selectTool(selectedToolId, e.target.value);
    },
    [selectedToolId]
  );

  const filteredBranches = branches.filter((v) => v.branch);

  if (availableTools.length <= 1 && filteredBranches.length <= 1) {
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
      {filteredBranches.length > 1 && (
        <select
          className="select select-xs select-bordered h-6 min-h-0 text-xs opacity-70"
          value={selectedBranch}
          onChange={handleBranchChange}
        >
          {filteredBranches.map((b) => (
            <option key={b.branch} value={b.branch}>
              {b.branch}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};
