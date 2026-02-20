import "./styles.css";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { useState } from "react";
import { TinyPatchworkLayoutDoc } from "./types";
import { useTool } from "@inkandswitch/patchwork-react";
import { toolify } from "@inkandswitch/patchwork-react";
import "@inkandswitch/patchwork-elements";

const ContextSidebar = ({
  docUrl: accountDocUrl,
  element,
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

  const closeSidebar = () => {
    let root: Document | ShadowRoot =
      element instanceof ShadowRoot
        ? element
        : (element.getRootNode() as Document | ShadowRoot);
    if (root instanceof ShadowRoot) {
      root = root.host.getRootNode() as Document | ShadowRoot;
    }
    const toggles = root.querySelectorAll(".sidebar-toggle");
    (toggles[toggles.length - 1] as HTMLElement)?.click();
  };

  return (
    <div className="w-full h-full flex flex-col bg-base-300 context-sidebar">
      {/* Tab Bar */}
      <div className="flex place-content-center place-items-start">
        <div role="tablist" className="tabs tabs-lifted flex-1">
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
        <button
          className="sidebar-close-button"
          onClick={closeSidebar}
          title="Close context sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M15 3v18" />
          </svg>
        </button>
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
