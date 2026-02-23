import "./styles.css";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import {
  getType,
  HasPatchworkMetadata,
  getToolSource,
} from "@inkandswitch/patchwork-filesystem";
import {
  ToolElement,
  ToolDescription,
  getRegistry,
  getSupportedToolsForType,
} from "@inkandswitch/patchwork-plugins";
import { useToolDescriptions } from "@inkandswitch/patchwork-react";
import {
  openDocument,
  ToolSelectedEvent,
} from "@inkandswitch/patchwork-elements";
import { useState, useEffect, useMemo, useCallback } from "react";

export const ToolPicker = ({
  docUrl,
  element,
}: {
  docUrl: AutomergeUrl;
  element: ToolElement;
}) => {
  const [doc] = useDocument<HasPatchworkMetadata>(docUrl);
  const allTools = useToolDescriptions();

  const docType = doc ? getType(doc) : undefined;
  const toolSource = doc ? getToolSource(doc) : undefined;

  const supportedTools = useMemo(() => {
    if (!docType) return [];
    return getSupportedToolsForType(docType).filter((t) => !t.unlisted);
  }, [docType, allTools]);

  const toolRegistry = useMemo(
    () => getRegistry<ToolDescription>("patchwork:tool"),
    []
  );

  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("default");

  useEffect(() => {
    if (!selectedToolId && supportedTools.length > 0) {
      setSelectedToolId(supportedTools[0].id);
    }
  }, [supportedTools, selectedToolId]);

  const branches = useMemo(() => {
    if (!selectedToolId) return [];
    return toolRegistry.getVersions(selectedToolId).filter((v) => v.branch);
  }, [selectedToolId, allTools]);

  const handleToolChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const toolId = e.target.value;
      setSelectedToolId(toolId);
      setSelectedBranch("default");
      openDocument(element, docUrl, toolId);
    },
    [element, docUrl]
  );

  const handleBranchChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const branch = e.target.value;
      if (!selectedToolId) return;
      const branchVersion = toolRegistry.getBranch(selectedToolId, branch);
      if (!branchVersion?.importUrl) return;

      setSelectedBranch(branch);

      console.log("[ToolPicker] dispatching tool-selected:", {
        branch,
        toolId: branchVersion.id,
        toolUrl: branchVersion.importUrl?.slice(0, 60) + "...",
      });
      element.dispatchEvent(
        new ToolSelectedEvent({
          toolUrl: branchVersion.importUrl,
          toolId: branchVersion.id,
        })
      );
    },
    [element, docUrl, selectedToolId, toolRegistry]
  );

  if (supportedTools.length <= 1 && branches.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 h-full">
      {supportedTools.length > 1 && (
        <select
          className="select select-xs select-bordered h-6 min-h-0"
          value={selectedToolId ?? ""}
          onChange={handleToolChange}
        >
          {supportedTools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tool.name}
            </option>
          ))}
        </select>
      )}
      {branches.length > 1 && (
        <select
          className="select select-xs select-bordered h-6 min-h-0 text-xs opacity-70"
          value={selectedBranch}
          onChange={handleBranchChange}
        >
          {branches.map((b) => (
            <option key={b.branch} value={b.branch}>
              {b.branch}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};
