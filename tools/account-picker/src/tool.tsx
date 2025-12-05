import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";

export const plugins = [
  {
    type: "patchwork:tool",
    id: "account-picker",
    name: "Account Picker",
    supportedDatatypes: ["account"],
    async load(): Promise<ToolImplementation> {
      const {createRoot} = await import("react-dom/client");
      const { RepoContext } = await import("@automerge/automerge-repo-react-hooks");
      const {AccountPicker} = await import("./AccountPicker")
      return (handle, element) => {
        const root = createRoot(element);
        root.render(
          <RepoContext.Provider value={element.repo}>
            <AccountPicker handle={handle} element={element} />
          </RepoContext.Provider>
        );
        return () => root.unmount();
      };
    },
  },
];
