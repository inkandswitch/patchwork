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

export const plugins = [
  {
    type: "patchwork:tool",
    id: "orion/commands",
    name: "Commands",
    // No supported data types as this is a global tool
    supportedDataTypes: [],
    async load(): Promise<ToolImplementation> {
      // HACK because we have no real solution for this kind of tool yet...

      // :)
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

      // Return a no-op tool implementation
      return () => {
        return () => {};
      };
    },
  },
];
