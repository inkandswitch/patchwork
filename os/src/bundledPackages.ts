// Core packages and better supported ones (and kanban for whatever)
export const SAFE_BUNDLED_TOOLS = {
  essay: "@patchwork/essay",
  file: "@patchwork/file",
  folder: "@patchwork/folder",
  jacquard: "@patchwork/jacquard",
  kanban: "@patchwork/kanban",
  pkg: "@patchwork/pkg",
  raw: "@patchwork/raw-editor",
};

export const BUNDLED_TOOLS = {
  ...SAFE_BUNDLED_TOOLS,
  // TODO: this is breaking the jacquard cli. why? i don't know.
  datagrid: "@patchwork/datagrid",

  // TODO: Causes import issues at 2.0.0-alpha.17. Fixed by 2.0.0, but
  // that requires code changes and may lead to data incompatibility.
  engraft: "@patchwork/engraft",

  // TODO: Causes "dyld[]: missing symbol called" error for Paul.
  tldraw: "@patchwork/tldraw",
};

// just copy it for now til i split up the datatypes as a separate export
export const BUNDLED_DATATYPES = {
  datagrid: "@patchwork/datagrid/datatype",
  essay: "@patchwork/essay/datatype",
  engraft: "@patchwork/engraft/datatype",
  file: "@patchwork/file/datatype",
  folder: "@patchwork/folder/datatype",
  jacquard: "@patchwork/jacquard/datatype",
  kanban: "@patchwork/kanban/datatype",
  pkg: "@patchwork/pkg/datatype",
  tldraw: "@patchwork/tldraw/datatype",
  // no specific raw editor datatype
};

// These two are held as examples for (current-era) dynamic loading.
// We don't use this variable, it's just here to explain why these
// packages aren't otherwise referenced.
export const UNBUNDLED_PACKAGES = {
  counter: "@patchwork/counter",
  "folder-list-view": "@patchwork/folder-list-view",
};
