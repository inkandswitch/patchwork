import { createRoot } from "react-dom/client";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { AccountPicker } from "./AccountPicker";

export const plugins = [
  {
    type: "patchwork:tool",
    id: "account-picker",
    name: "Account Picker",
    supportedDataTypes: ["account"],
    async load(): Promise<ToolImplementation> {
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
