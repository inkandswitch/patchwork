import "./index.css";
import { render } from "solid-js/web";
import { type ToolImplementation } from "@inkandswitch/patchwork-plugins";
import type { TinyPatchworkAccountDoc } from "./types.ts";

async function loadStyles() {
  const url = new URL("./index.css", import.meta.url);
  return (await fetch(url)).text();
}

function addStyles(textContent: string) {
  const id = "sideboard-styles";
  const el =
    document.head.querySelector(`#${id}`) ?? document.createElement("style");
  Object.assign(el, { textContent, id });
  document.head.append(el);
}

export const plugins = [
  {
    id: "chee/sideboard",
    type: "patchwork:tool",
    tags: ["sidebar-account"],
    name: "Sideboard",
    supportedDatatypes: ["patchwork:account", "folder"],
    icon: "FolderOpen",
    unlisted: true,
    async load(): Promise<ToolImplementation<TinyPatchworkAccountDoc>> {
      const [{ Sideboard }, styles] = await Promise.all([
        import("./sideboard/sideboard.tsx"),
        loadStyles(),
      ]);
      return (handle, element) => {
        addStyles(styles);
        return render(
          () => (
            // @ts-expect-error - handle type doesn't know it supports folders
            <Sideboard handle={handle} repo={element.repo} element={element} />
          ),
          element
        );
      };
    },
  },
];
