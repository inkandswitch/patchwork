import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";

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
      const { render } = await import("solid-js/web");
      const { SyncIndicator, RepoContext } = await import("./SyncIndicator");
      return (handle, element) => {
        element.style.width = "fit-content";
        element.style.zIndex = "10";

        const dispose = render(
          () => (
            <RepoContext.Provider value={element.repo}>
              <SyncIndicator handle={handle} />
            </RepoContext.Provider>
          ),
          element
        );
        return () => dispose();
      };
    },
  },
];
