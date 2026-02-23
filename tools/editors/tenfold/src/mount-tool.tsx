import { render } from "solid-js/web";
import type { DocHandle } from "@automerge/automerge-repo";
import type { Tenfold } from "./index.tsx";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";

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

const styles = await loadStyles();
addStyles(styles);

const tool = await import("./tool.tsx");

const mount: ToolImplementation = (handle, element) => {
  return render(
    () => (
      <tool.default
        handle={handle as DocHandle<Tenfold>}
        element={element}
      />
    ),
    element
  );
};

export default mount;
