import { createRoot } from "react-dom/client";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";
import styles from "./main.css";
import { initCommands } from "./commands.ts";
import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type { TinyPatchworkLayoutDoc } from "../../../sites/tiny-patchwork/src/layout-doc.ts";

declare global {
  interface Window {
    accountDocHandle: DocHandle<TinyPatchworkLayoutDoc>;
    repo: Repo;
  }
}

// Side-effect: initialize commands and render command palette
setTimeout(() => {
  initCommands(window.accountDocHandle, window.repo);
}, 1000);

const { CommandPalette } = await import("./CommandPalette.tsx");
const container = document.createElement("div");
container.id = "command-palette-root";
document.body.appendChild(container);
const shadowRoot = container.attachShadow({ mode: "open" });
const sheet = new CSSStyleSheet();
sheet.replaceSync(styles as string);
shadowRoot.adoptedStyleSheets ??= [];
shadowRoot.adoptedStyleSheets.push(sheet);

const root = createRoot(shadowRoot);
root.render(<CommandPalette />);

const mount: ToolImplementation = () => {
  return () => {};
};

export default mount;
