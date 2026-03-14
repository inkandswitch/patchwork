import "./index.css";
import { render } from "solid-js/web";
import { type ToolImplementation } from "@inkandswitch/patchwork-plugins";
import type { TinyPatchworkAccountDoc } from "./types.ts";

function addStyles() {
  const id = "sideboard-styles";
  const el =
    (document.head.querySelector(`#${id}`) as HTMLLinkElement) ??
    document.createElement("link");
  el.href = new URL("./index.css", import.meta.url).href;
  el.rel = "stylesheet";
  el.id = id;
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
      const { Sideboard } = await import("./sideboard/sideboard.tsx");
      return (handle, element) => {
        addStyles();
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
