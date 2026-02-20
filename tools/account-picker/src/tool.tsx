import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";
import { render } from "solid-js/web";
import "./styles.css";
import { RepoContext } from "@automerge/automerge-repo-solid-primitives";

function addStyles(element: HTMLElement, textContent: string) {
  const id = "account-picker-styles";
  const el = element.querySelector(`#${id}`) ?? document.createElement("style");
  Object.assign(el, { textContent, id });
  element.append(el);
}

async function loadStyles() {
  const url = new URL("./tool.css", import.meta.url);
  return (await fetch(url)).text();
}

export const plugins = [
  {
    type: "patchwork:tool",
    id: "account-picker",
    name: "Account Picker",
    supportedDatatypes: ["account"],
    async load(): Promise<ToolImplementation> {
      const { AccountPicker } = await import("./AccountPicker");
      const css = await loadStyles();
      return (handle, element) => {
        addStyles(document.head, css);
        console.log("account picker");
        const dispose = render(
          () => (
            <RepoContext.Provider value={element.repo}>
              <AccountPicker handle={handle} element={element} />
            </RepoContext.Provider>
          ),
          element
        );
        return () => dispose();
      };
    },
  },
];
