// This is a BUILD TIME file, used to track dependencies that all patchwork SDK projects
// can/should rely on existing at runtime.

// This is really a provisional solution to help the existing vite.configs as we figure out what to do next.

export const SHARED_DEPENDENCIES = [
  "@automerge/automerge-repo",
  "@automerge/automerge-repo-react-hooks",
  "@automerge/automerge",
  "@codemirror/autocomplete",
  "@codemirror/commands",
  "@codemirror/lang-markdown",
  "@codemirror/language",
  "@codemirror/language-data",
  "@codemirror/search",
  "@codemirror/state",
  "@codemirror/view",
  "react",
  "react-dom",
  "react-dom/client",
  "react-dom/server",
  "react/jsx-runtime",
  "eventemitter3",
  "uuid",
  "fast-sha256",
  "debug",
  "cbor-x",
  "bs58check",
  "@automerge/automerge/slim",
  "@automerge/automerge/slim/next",
  "xstate",
];

// Internal modules that are shared with dynamically loaded packages
export const SHARED_MODULES = {
  // SDK modules
  "@patchwork/sdk": "./sdk/index.js",
  "@patchwork/sdk/async-signals": "./sdk/async-signals.js",
  "@patchwork/sdk/components": "./sdk/components.js",
  "@patchwork/sdk/hooks": "./sdk/hooks.js",
  "@patchwork/sdk/markdown": "./sdk/markdown.js",
  "@patchwork/sdk/router": "./sdk/router.js",
  "@patchwork/sdk/textAnchors": "./sdk/textAnchors.js",
  "@patchwork/sdk/ui": "./sdk/ui.js",
  "@patchwork/sdk/versionControl": "./sdk/versionControl.js",

  "@patchwork/datagrid": "./datagrid/index.js",
  "@patchwork/essay": "./essay/index.js",
  "@patchwork/file": "./file/index.js",
  "@patchwork/file/components": "./file/components.js", // blerf
  "@patchwork/folder": "./folder/index.js",
  "@patchwork/jacquard": "./jacquard/index.js",
  "@patchwork/jacquard/components": "./jacquard/components.js", // blerf
  "@patchwork/jacquard/hooks": "./jacquard/hooks.js",
  "@patchwork/kanban": "./kanban/index.js",
  "@patchwork/my-tools": "./my-tools/index.js",
  "@patchwork/raw-editor": "./raw-editor/index.js",
  "@patchwork/tldraw": "./tldraw/index.js",
};

// All dependencies that should not be bundled in and instead are loaded
// through the import map created by generateImportMapPlugin
export const EXTERNAL_DEPENDENCIES = SHARED_DEPENDENCIES.concat(
  Object.keys(SHARED_MODULES)
);
