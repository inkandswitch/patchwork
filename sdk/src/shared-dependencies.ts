// This is a BUILD TIME file, used to track dependencies that all patchwork SDK projects
// can/should rely on existing at runtime.

// This is really a provisional solution to help the existing vite.configs as we figure out what to do next.

export const SHARED_DEPENDENCIES = [
  "@automerge/automerge",
  "@automerge/automerge-repo",
  "@automerge/automerge-repo-react-hooks",
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
];

// Internal modules that are shared with dynamically loaded packages
export const SHARED_MODULES = {
  "@patchwork/sdk": "./sdk/index.js",
  "@patchwork/sdk/async-signals": "./sdk/async-signals.js",
  "@patchwork/sdk/components": "./sdk/components.js",
  "@patchwork/sdk/hooks": "./sdk/hooks.js",
  "@patchwork/sdk/markdown": "./sdk/markdown.js",
  "@patchwork/sdk/router": "./sdk/router.js",
  "@patchwork/sdk/textAnchors": "./sdk/textAnchors.js",
  "@patchwork/sdk/ui": "./sdk/ui.js",
  "@patchwork/sdk/versionControl": "./sdk/versionControl.js",
  "@patchwork/counter": "./counter/index.js",
  "@patchwork/datagrid": "./datagrid/index.js",
  "@patchwork/engraft": "./engraft/index.js",
  "@patchwork/essay": "./essay/index.js",
  "@patchwork/file": "./file/index.js",
  "@patchwork/folder": "./folder/index.js",
  //"@patchwork/folder-list-view": "./folder-list-view/index.js", // left as an example of existing dynamic loading
  "@patchwork/jacquard": "./jacquard/index.js",
  "@patchwork/kanban": "./kanban/index.js",
  "@patchwork/pkg": "./pkg/index.js",
  "@patchwork/raw-editor": "./raw-editor/index.js",
  "@patchwork/tldraw": "./tldraw/index.js",
};

// All dependencies that should not be bundled in and instead are loaded
// through the import map created by generateImportMapPlugin
export const EXTERNAL_DEPENDENCIES = SHARED_DEPENDENCIES.concat(
  Object.keys(SHARED_MODULES)
);
