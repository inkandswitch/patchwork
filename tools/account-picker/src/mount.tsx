import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";
import { createRoot } from "react-dom/client";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { AccountPicker } from "./AccountPicker";

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

const css = await loadStyles();

const mount: ToolImplementation = (handle, element) => {
  addStyles(document.head, css);
  const root = createRoot(element);
  root.render(
    <RepoContext.Provider value={element.repo}>
      <AccountPicker handle={handle} element={element} />
    </RepoContext.Provider>
  );
  return () => root.unmount();
};

export default mount;
