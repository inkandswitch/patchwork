import { createRoot } from "react-dom/client";
import type { ToolImplementation } from "@patchwork/plugins";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { AccountPicker } from "./AccountPicker";

export const plugins = [
  {
    type: "patchwork:tool",
    id: "account-picker",
    name: "Account Picker",
    icon: "User",
    supportedDataTypes: "*",
    unlisted: true,
    async load(): Promise<ToolImplementation> {
      return (handle, element) => {
        element.style.width = "fit-content";

        const root = createRoot(element);
        root.render(
          <RepoContext.Provider value={element.repo}>
            <AccountPicker />
          </RepoContext.Provider>
        );
        return () => root.unmount();
      };
    },
  },
];
