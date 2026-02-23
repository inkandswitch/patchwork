import type { PluginDescription } from "@inkandswitch/patchwork-plugins";

export const plugins: PluginDescription[] = [
  {
    type: "patchwork:tool",
    id: "history-view",
    category: "context-tool",
    name: "History",
    icon: "History",
    supportedDatatypes: ["account"],
    importPath: "./dist/mount-history-view.js",
    unlisted: true,
  } as any,
  {
    type: "patchwork:tool",
    id: "highlight-changes-checkbox",
    tags: ["titlebar-tool"],
    name: "Highlight Changes",
    icon: "Highlighter",
    supportedDatatypes: "*",
    importPath: "./dist/mount-highlight-changes.js",
    unlisted: true,
    forTitleBar: true,
  } as any,
];
