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
  "@patchwork/counter/datatype": "./counter/datatype.js", // do i really need to do this?
  "@patchwork/datagrid": "./datagrid/index.js",
  "@patchwork/datagrid/datatype": "./datagrid/datatype.js",
  "@patchwork/engraft": "./engraft/index.js",
  "@patchwork/engraft/datatype": "./engraft/datatype.js",
  "@patchwork/essay": "./essay/index.js",
  "@patchwork/essay/datatype": "./essay/datatype.js",
  "@patchwork/file": "./file/index.js",
  "@patchwork/file/datatype": "./file/datatype.js",
  "@patchwork/folder": "./folder/index.js",
  "@patchwork/folder/datatype": "./folder/datatype.js",
  //"@patchwork/folder-list-view": "./folder-list-view/index.js", // left as an example of existing dynamic loading
  "@patchwork/jacquard": "./jacquard/index.js",
  "@patchwork/jacquard/datatype": "./jacquard/datatype.js",
  "@patchwork/jacquard/components": "./jacquard/components.js", // blerf
  "@patchwork/jacquard/hooks": "./jacquard/hooks.js",
  "@patchwork/kanban": "./kanban/index.js",
  "@patchwork/kanban/datatype": "./kanban/datatype.js",
  "@patchwork/module-settings": "./module-settings/index.js",
  "@patchwork/module-settings/datatype": "./module-settings/datatype.js",
  "@patchwork/pkg": "./pkg/index.js",
  "@patchwork/pkg/datatype": "./pkg/datatype.js",
  "@patchwork/raw-editor": "./raw-editor/index.js",
  // no datatype for raw-editor
  "@patchwork/tldraw": "./tldraw/index.js",
  "@patchwork/tldraw/datatype": "./tldraw/datatype.js",
};

// All dependencies that should not be bundled in and instead are loaded
// through the import map created by generateImportMapPlugin
export const EXTERNAL_DEPENDENCIES = SHARED_DEPENDENCIES.concat(
  Object.keys(SHARED_MODULES)
);
