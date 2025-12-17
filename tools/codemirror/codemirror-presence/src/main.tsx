import type { Extension } from "@codemirror/state";
import type { PresencePluginConfig } from "./extension.js";

export type { PresencePluginConfig } from "./extension.js";

/**
 * CodeMirror extension factory function.
 * Takes the editor context and returns an Extension.
 */
export type ExtensionFactory = (config: PresencePluginConfig) => Extension;

export const plugins = [
  {
    type: "codemirror:extension",
    id: "codemirror-automerge-presence",
    name: "Automerge-Repo Presence",
    supportedDatatypes: ["markdown"],
    async load(): Promise<ExtensionFactory> {
      const { automergePresencePlugin } = await import("./extension.js");
      return automergePresencePlugin;
    },
  },
];
