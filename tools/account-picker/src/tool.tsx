import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";
import { createRoot } from "react-dom/client";
import "./styles.css";

export const plugins = [
  {
    type: "patchwork:tool",
    id: "account-picker",
    name: "Account Picker",
    supportedDatatypes: ["account"],
    async load(): Promise<ToolImplementation> {
      injectStyles();
      const { RepoContext } =
        await import("@automerge/automerge-repo-react-hooks");
      const { AccountPicker } = await import("./AccountPicker");
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

function injectStyles() {
  // hack: Inject link element with stylesheet
  const cssHref = new URL("./tool.css", import.meta.url).href;
  if (!document.querySelector(`link[href="${cssHref}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssHref;
    document.head.appendChild(link);
  }
}
