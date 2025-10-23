import { createRoot } from "react-dom/client";
import type { ToolImplementation } from "@patchwork/plugins";
import { dataType as datatype } from "./datatype.ts";
import { RepoContext } from "@automerge/react";
import "tldraw/tldraw.css";

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
    type: "patchwork:datatype",
    id: "tldraw",
    name: "Drawing",
    icon: "PenLine",
    module: datatype,
  },
  {
    type: "patchwork:tool",
    id: "tldraw",
    name: "Drawing",
    supportedDataTypes: ["tldraw"],
    async load(): Promise<ToolImplementation> {
      const { TldrawTool } = await import("./tool.tsx");
      const styles = await loadStyles();
      return (handle, element) => {
        addStyles(element, styles);
        const root = createRoot(element);
        root.render(
          <RepoContext.Provider value={element.repo}>
            <TldrawTool docUrl={handle.url} />
          </RepoContext.Provider>
        );
        return () => root.unmount();
      };
    },
  },
];
