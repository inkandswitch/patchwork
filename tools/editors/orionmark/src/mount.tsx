import { createRoot } from "react-dom/client";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { MarkdownTool } from "./tool.tsx";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";

function addStyles(element: HTMLElement, textContent: string) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(textContent);
  const rootNode = element.getRootNode();
  (rootNode as typeof document | ShadowRoot).adoptedStyleSheets ??= [];
  (rootNode as typeof document | ShadowRoot).adoptedStyleSheets.push(sheet);
}

async function loadStyles() {
  const url = new URL("./main.css", import.meta.url);
  return (await fetch(url)).text();
}

const styles = await loadStyles();

const mount: ToolImplementation = (handle, element) => {
  addStyles(element, styles);
  const root = createRoot(element);
  root.render(
    <RepoContext.Provider value={element.repo}>
      <MarkdownTool docUrl={handle.url} />
    </RepoContext.Provider>
  );
  return () => root.unmount();
};

export default mount;
