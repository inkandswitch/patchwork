// This is a BUILD TIME file, used to track dependencies that all patchwork SDK projects
// can/should rely on existing at runtime.

// This is really a provisional solution to help the existing vite.configs as we figure out what to do next.

export const SHARED_DEPENDENCIES = [
  "@automerge/automerge-repo",
  "@automerge/vanillajs",
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
  "signia",
];

// Internal modules that are shared with dynamically loaded packages
export const SHARED_MODULES = {
  // SDK modules
  "@patchwork/sdk": "file:../sdk/",
};

export const SDK_SUBMODULES = [
  "@patchwork/sdk/embed",
  "@patchwork/sdk/modules",
  "@patchwork/sdk/plugins",
  "@patchwork/sdk/shared-dependencies",
];

// All dependencies that should not be bundled in and instead are loaded
// through the import map created by generateImportMapPlugin
export const EXTERNAL_DEPENDENCIES = SHARED_DEPENDENCIES.concat(
  Object.keys(SHARED_MODULES)
).concat(SDK_SUBMODULES);
