import { createRoot } from "react-dom/client";
import { RepoContext } from "@automerge/react";
import { TldrawTool } from "./tool.tsx";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";

function addStyles(textContent: string, element: HTMLElement = document.head) {
  const id = "tldraw4-styles";
  const el = element.querySelector(`#${id}`) ?? document.createElement("style");
  Object.assign(el, { textContent, id });
  element.append(el);
}

async function loadStyles() {
  const url = new URL("./main.css", import.meta.url);
  return (await fetch(url)).text();
}

const styles = await loadStyles();

const mount: ToolImplementation = (handle, element) => {
  const root = createRoot(element);
  addStyles(styles);
  root.render(
    <RepoContext.Provider value={element.repo}>
      <TldrawTool docUrl={handle.url} />
    </RepoContext.Provider>
  );
  return () => root.unmount();
};

export default mount;
