// Core packages and better supported ones (and kanban for whatever)
export const SAFE_BUNDLED_TOOLS = {
  essay: "@patchwork/essay",
  file: "@patchwork/file",
  folder: "@patchwork/folder",
  "jacquard-build-metadata": "@patchwork/jacquard",
  kanban: "@patchwork/kanban",
  "module-settings": "@patchwork/module-settings",
  raw: "@patchwork/raw-editor",
};

export const BUNDLED_TOOLS = {
  ...SAFE_BUNDLED_TOOLS,
  // TODO: this is breaking the jacquard cli. why? i don't know.
  datagrid: "@patchwork/datagrid",

  // TODO: Causes "dyld[]: missing symbol called" error for Paul.
  tldraw: "@patchwork/tldraw",
};

export const BUNDLED_DATATYPES = {
  datagrid: "@patchwork/datagrid/datatype",
  essay: "@patchwork/essay/datatype",
  file: "@patchwork/file/datatype",
  folder: "@patchwork/folder/datatype",
  "jacquard-build-metadata": "@patchwork/jacquard/datatype",
  kanban: "@patchwork/kanban/datatype",
  tldraw: "@patchwork/tldraw/datatype",
  "module-settings": "@patchwork/module-settings/datatype",
  // no specific raw editor datatype
};

// These two are held as examples for (current-era) dynamic loading.
// We don't use this variable, it's just here to explain why these
// packages aren't otherwise referenced.
export const UNBUNDLED_PACKAGES = {
  counter: "@patchwork/counter",
  "folder-list-view": "@patchwork/folder-list-view",
  engraft: "@patchwork/engraft",
  pkg: "@patchwork/pkg",
  sequencer: "@patchwork/sequencer",
};
