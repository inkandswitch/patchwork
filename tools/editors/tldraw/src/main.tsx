import { createRoot } from "react-dom/client";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";
import { datatype as datatype } from "./datatype.ts";
import { RepoContext } from "@automerge/react";
import "./main.css";

function addStyles(
  textContent: string,
  element: HTMLElement = self.document?.head
) {
  const id = "tenfold-styles";
  const el = element.querySelector(`#${id}`) ?? document.createElement("style");
  Object.assign(el, { textContent, id });
  element.append(el);
}

async function loadStyles() {
  const url = new URL("./tenfold.css", import.meta.url);
  return (await fetch(url)).text();
}

export const plugins = [
  {
    type: "patchwork:datatype",
    id: "tldraw",
    name: "Drawing",
    icon: "PenLine",
    async load() {
      return datatype;
    },
  },
  {
    type: "patchwork:tool",
    id: "tldraw",
    name: "Drawing",
    supportedDatatypes: ["tldraw"],
    async load(): Promise<ToolImplementation> {
      const { TldrawTool } = await import("./tool.tsx");
      const styles = await loadStyles();
      return (handle, element) => {
        const root = createRoot(element);
        addStyles(styles, element);
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
