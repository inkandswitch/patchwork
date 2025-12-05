import { createRoot } from "react-dom/client";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { SyncIndicator } from "./SyncIndicator";

export const plugins = [
  {
    type: "patchwork:tool",
    id: "sync-indicator",
    name: "Sync Indicator",
    icon: "Wifi",
    supportedDatatypes: "*" as const,
    unlisted: true,
    async load(): Promise<ToolImplementation> {
      return (handle, element) => {
        element.style.width = "fit-content";
        element.style.zIndex = "10";

        const root = createRoot(element);
        root.render(
          <RepoContext.Provider value={element.repo}>
            <SyncIndicator docUrl={handle.url} />
          </RepoContext.Provider>
        );
        return () => root.unmount();
      };
    },
  },
];
