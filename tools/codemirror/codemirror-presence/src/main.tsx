import type { Extension } from "@codemirror/state";

export const plugins = [
  {
    type: "codemirror:extension",
    id: "codemirror-automerge-presence",
    name: "Automerge-Repo Presence",
    supportedDatatypes: ["markdown"],
    async load(): Promise<Extension> {
      const { automergePresencePlugin } = await import("./extension.js");
      return automergePresencePlugin(config);
    },
  },
];
