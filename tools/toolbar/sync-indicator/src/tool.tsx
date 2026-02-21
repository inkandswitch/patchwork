import { render } from "solid-js/web";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";
import { SyncIndicator, RepoContext } from "./SyncIndicator";

export const plugins = [
  {
    type: "patchwork:tool",
    id: "sync-indicator",
    tags: ["titlebar-tool"],
    name: "Sync Indicator",
    icon: "Wifi",
    supportedDatatypes: "*" as const,
    unlisted: true,
    forTitleBar: true,
    async load(): Promise<ToolImplementation> {
      return (handle, element) => {
        element.style.width = "fit-content";
        element.style.zIndex = "10";

        const dispose = render(
          () => (
            <RepoContext.Provider value={element.repo}>
              <SyncIndicator docUrl={handle.url} />
            </RepoContext.Provider>
          ),
          element
        );
        return () => dispose();
      };
    },
  },
];
