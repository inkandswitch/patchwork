import "./index.css";
import { render } from "solid-js/web";
import { type ToolImplementation } from "@inkandswitch/patchwork-plugins";
import type { TinyPatchworkAccountDoc } from "./types.ts";
import "solid-devtools/setup";

function addStyles(element: HTMLElement, textContent: string) {
  const id = "sideboard-styles";
  const el = element.querySelector(`#${id}`) ?? document.createElement("style");
  Object.assign(el, { textContent, id });
  element.append(el);
}

async function loadStyles() {
  const url = new URL("./index.css", import.meta.url);
  return (await fetch(url)).text();
}

export const plugins = [
  {
    id: "chee/sideboard",
    type: "patchwork:tool",
    name: "Sideboard",
    supportedDatatypes: ["patchwork:account"],
    icon: "FolderOpen",
    async load(): Promise<ToolImplementation<TinyPatchworkAccountDoc>> {
      const { Sideboard } = await import("./sideboard/sideboard.tsx");
      const css = await loadStyles();
      return (handle, element) => {
        addStyles(element, css);
        return render(
          () => (
            <Sideboard handle={handle} repo={element.repo} element={element} />
          ),
          element
        );
      };
    },
  },
];
