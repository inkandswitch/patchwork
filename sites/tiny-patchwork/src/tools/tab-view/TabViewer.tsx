import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { useDocRef, useSubcontext } from "@patchwork/context/react";
import { IsSelected } from "@patchwork/context/selection";
import { X } from "lucide-react";
import { useEffect } from "react";
import { openDocument, OpenDocumentEvent } from "../../lib/navigation";
import { toolify } from "../../lib/toolify";
import { useDatatypeDescriptions } from "../../lib/datatype-hooks";
import { TabViewDoc } from "./datatype";
import type { HasPatchworkMetadata } from "@patchwork/filesystem";

const TabViewer = ({
  docUrl,
  element,
}: {
  docUrl: AutomergeUrl;
  element: HTMLElement | ShadowRoot;
}) => {
  const [tabViewDoc, changeTabViewDoc] = useDocument<TabViewDoc>(docUrl, {
    suspense: true,
  });
  const datatypes = useDatatypeDescriptions();
  const selectionContext = useSubcontext("TAB_VIEWER_SELECTION");

  // Get the active tab's document reference for context
  const activeTab =
    tabViewDoc.activeTabIndex !== undefined
      ? tabViewDoc.tabs[tabViewDoc.activeTabIndex]
      : null;
  const activeDocRef = useDocRef(activeTab?.url);

  // add open doc to context
  useEffect(() => {
    console.log("!! set selectedDocRef", activeDocRef);

    selectionContext.replace(
      activeDocRef ? [activeDocRef.with(IsSelected(true))] : []
    );
  }, [activeDocRef, selectionContext]);

  // Listen for open document events
  useEffect(() => {
    if (element) {
      const handleOpenDocument = (event: OpenDocumentEvent) => {
        const {
          detail: { url, toolId },
        } = event;
        console.log("!! tab viewer: handle open document event", event);

        changeTabViewDoc((doc) => {
          // Check if tab already exists
          const existingTabIndex = doc.tabs.findIndex(
            (tab) => tab.url === url && tab.toolId === toolId
          );

          if (existingTabIndex >= 0) {
            // Tab exists, just make it active
            doc.activeTabIndex = existingTabIndex;
          } else {
            // Create new tab
            doc.tabs.push({ url, toolId });
            doc.activeTabIndex = doc.tabs.length - 1;
          }
        });
      };

      (element as HTMLElement).addEventListener(
        "patchwork:open-document",
        handleOpenDocument
      );
      return () => {
        (element as HTMLElement).removeEventListener(
          "patchwork:open-document",
          handleOpenDocument
        );
      };
    }
  }, [changeTabViewDoc, element, datatypes]);

  const handleTabClick = (index: number) => {
    changeTabViewDoc((doc) => {
      doc.activeTabIndex = index;
    });

    openDocument(element, tabViewDoc.tabs[index]?.url);
  };

  const handleCloseTab = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    changeTabViewDoc((doc) => {
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

  if (tabViewDoc.tabs.length === 0) {
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
        {tabViewDoc.tabs.map((tab, index) => {
          const ref = useDocRef<HasPatchworkMetadata>(tab?.url);
          const type = ref?.value["@patchwork"].type;

          const datatype = datatypes.find((dt) => dt.id === type);
          const datatypeName = datatype?.name || type;
          const tabName = datatype?.module.getTitle(ref?.value) ?? datatypeName;

          return (
            <a
              key={`${tab}-${index}`}
              role="tab"
              className={`tab ${
                index === tabViewDoc.activeTabIndex ? "tab-active" : ""
              }`}
              onClick={() => handleTabClick(index)}
            >
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-start">
                  <span className="text-sm">{tabName}</span>
                </div>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={(e) => handleCloseTab(index, e)}
                  title="Close tab"
                >
                  <X size={12} />
                </button>
              </div>
            </a>
          );
        })}
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

export const renderTabViewer = toolify(TabViewer);
