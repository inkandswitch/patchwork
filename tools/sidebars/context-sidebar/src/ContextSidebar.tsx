import "./styles.css";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { useState } from "react";
import { TinyPatchworkLayoutDoc } from "./types";
import { useTool } from "@patchwork/react";
import { toolify } from "@patchwork/react";
import "@inkandswitch/patchwork-elements";

const ContextSidebar = ({
  docUrl: accountDocUrl,
}: {
  docUrl: AutomergeUrl;
  element: HTMLElement | ShadowRoot;
}) => {
  const [accountDoc] = useDocument<TinyPatchworkLayoutDoc>(accountDocUrl, {
    suspense: true,
  });

  const [selectedToolIndex, setSelectedToolIndex] = useState(0);
  const selectedToolId = accountDoc.contextToolIds[selectedToolIndex];

  const handleTabClick = (index: number) => {
    setSelectedToolIndex(index);
  };

  return (
    <div className="w-full h-full flex flex-col bg-base-300">
      {/* Tab Bar */}
      <div role="tablist" className="tabs tabs-lifted">
        {accountDoc.contextToolIds.map((toolId, index) => (
          <TabLabel
            key={index}
            toolId={toolId}
            index={index}
            isActive={index === selectedToolIndex}
            onSelect={handleTabClick}
          />
        ))}
      </div>
      {/* Active Tab Content */}
      <div className="flex-1 bg-base-300 min-h-0 overflow-auto">
        {selectedToolIndex !== undefined && (
          <patchwork-view doc-url={accountDocUrl} tool-id={selectedToolId} />
        )}
      </div>
    </div>
  );
};

interface TabViewProps {
  toolId: string;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
}

const TabLabel = ({ toolId, index, isActive, onSelect }: TabViewProps) => {
  const tool = useTool(toolId);
  if (!tool) {
    return null;
  }

  return (
    <a
      role="tab"
      className={`tab ${isActive ? "tab-active" : ""}`}
      onClick={() => onSelect(index)}
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-start">
          <span className="text-sm">{tool.name}</span>
        </div>
      </div>
    </a>
  );
};

export const renderTabbedView = toolify(ContextSidebar);
