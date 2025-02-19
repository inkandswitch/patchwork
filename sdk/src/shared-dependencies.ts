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
  "@automerge/automerge/slim",
  "@automerge/automerge/slim/next",
  "lucide-react",
  "signia",
];

// Internal modules that are shared with dynamically loaded packages
export const SHARED_MODULES = {
  // SDK modules
  "@patchwork/sdk": "file:../sdk/",

  "@patchwork/datagrid": "file:../packages/datagrid",
  "@patchwork/essay": "file:../packages/essay",
  "@patchwork/file": "file:../packages/file",
  "@patchwork/folder": "file:../packages/folder",
  "@patchwork/jacquard": "file:../packages/jacquard",
  "@patchwork/kanban": "file:../packages/kanban",
  "@patchwork/my-tools": "file:../packages/my-tools",
  "@patchwork/raw-editor": "file:../packages/raw-editor",
  "@patchwork/tldraw": "file:../packages/tldraw",
};

// All dependencies that should not be bundled in and instead are loaded
// through the import map created by generateImportMapPlugin
export const EXTERNAL_DEPENDENCIES = SHARED_DEPENDENCIES.concat(
  Object.keys(SHARED_MODULES)
);
