import { createRoot } from "react-dom/client";
import type { ToolImplementation } from "@patchwork/plugins";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";

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

export const plugins = [
  {
    type: "patchwork:tool",
    id: "orion/markdown",
    name: "Orionmark",
    supportedDataTypes: ["markdown"],
    async load(): Promise<ToolImplementation> {
      const { MarkdownTool } = await import("./tool.tsx");
      const styles = await loadStyles();
      return (handle, element) => {
        addStyles(element, styles);
        const root = createRoot(element);
        root.render(
          <RepoContext.Provider value={element.repo}>
            <MarkdownTool docUrl={handle.url} />
          </RepoContext.Provider>
        );
        return () => root.unmount();
      };
    },
  },
];
