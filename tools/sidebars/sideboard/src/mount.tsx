import { render } from "solid-js/web";
import { Sideboard } from "./sideboard/sideboard.tsx";
import type { TinyPatchworkAccountDoc } from "./types.ts";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";

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

const css = await loadStyles();

const mount: ToolImplementation<TinyPatchworkAccountDoc> = (
  handle,
  element
) => {
  addStyles(element, css);
  return render(
    () => (
      <Sideboard handle={handle} repo={element.repo} element={element} />
    ),
    element
  );
};

export default mount;
