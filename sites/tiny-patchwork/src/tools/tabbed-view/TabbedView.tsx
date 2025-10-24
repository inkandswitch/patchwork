import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { useDocRef } from "@patchwork/context/react";
import type { HasPatchworkMetadata } from "@patchwork/filesystem";
import { X } from "lucide-react";
import { useDatatypeDescriptions } from "../../lib/datatype-hooks";
import { toolify } from "../../lib/toolify";
import { TabbedViewDoc } from "./datatype";

const TabbedView = ({
  docUrl,
}: {
  docUrl: AutomergeUrl;
  element: HTMLElement | ShadowRoot;
}) => {
  const [tabbedViewDoc, changeTabbedViewDoc] = useDocument<TabbedViewDoc>(
    docUrl,
    {
      suspense: true,
    }
  );
  const { showCloseButton, tabs, activeTabIndex } = tabbedViewDoc;
  const activeTab = activeTabIndex !== undefined ? tabs[activeTabIndex] : null;

  const handleTabClick = (index: number) => {
    changeTabbedViewDoc((doc) => {
      doc.activeTabIndex = index;
    });
  };

  const handleCloseTab = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    changeTabbedViewDoc((doc) => {
      doc.tabs.splice(index, 1);

      if (doc.activeTabIndex === undefined) {
        return;
      }

      // Adjust active tab index
      if (doc.activeTabIndex >= doc.tabs.length) {
        doc.activeTabIndex = doc.tabs.length - 1;
      } else if (doc.activeTabIndex > index) {
        doc.activeTabIndex = doc.activeTabIndex - 1;
      }
    });
  };

  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No tabs open. Open a document to create a tab.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Tab Bar */}
      <div role="tablist" className="tabs tabs-lifted">
        {tabs.map((tab, index) => (
          <TabView
            key={`${tab}-${index}`}
            tab={tab}
            index={index}
            isActive={index === tabbedViewDoc.activeTabIndex}
            onTabClick={handleTabClick}
            onCloseTab={showCloseButton ? handleCloseTab : undefined}
          />
        ))}
      </div>
      {/* Active Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab && (
          <View
            docUrl={activeTab.url}
            toolId={activeTab.toolId}
            key={activeTab.url}
          />
        )}
      </div>
    </div>
  );
};

interface TabViewProps {
  tab: { url: AutomergeUrl; toolId?: string; name?: string };
  index: number;
  isActive: boolean;
  onTabClick: (index: number) => void;
  onCloseTab?: (index: number, event: React.MouseEvent) => void;
}

const TabView = ({
  tab,
  index,
  isActive,
  onTabClick,
  onCloseTab,
}: TabViewProps) => {
  const ref = useDocRef<HasPatchworkMetadata>(tab?.url);
  const datatypes = useDatatypeDescriptions();

  const type = ref?.value["@patchwork"].type;
  const datatype = datatypes.find((dt) => dt.id === type);
  const datatypeName = datatype?.name || type;
  const tabName =
    tab.name ?? datatype?.module.getTitle(ref?.value) ?? datatypeName;

  return (
    <a
      key={`${tab}-${index}`}
      role="tab"
      className={`tab ${isActive ? "tab-active" : ""}`}
      onClick={() => onTabClick(index)}
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-start">
          <span className="text-sm">{tabName}</span>
        </div>
        {onCloseTab && (
          <button
            className="btn btn-ghost btn-xs"
            onClick={(e) => onCloseTab(index, e)}
            title="Close tab"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </a>
  );
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "doc-url": string;
        "tool-id"?: string | null;
        class?: string;
      };
    }
  }
}

const View = ({
  docUrl,
  toolId,
}: {
  docUrl: AutomergeUrl;
  toolId?: string;
}) => {
  return <patchwork-view doc-url={docUrl} tool-id={toolId} />;
};

export const renderTabbedView = toolify(TabbedView);
