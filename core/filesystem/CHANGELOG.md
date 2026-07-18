# @inkandswitch/patchwork-filesystem

## 0.2.0

### Minor Changes

- 82bee46: A doc's `suggestedImportUrl` may now be an `automerge:` folder-doc URL as well
  as an `http(s):` module bundle. When a view finds no built-in tool for a doc, it
  loads the suggested module either way. Adds `importPackage` (which dispatches on
  the URL scheme) and `isImportableSuggestedUrl` to `patchwork-filesystem`, and
  `getSuggestedImportUrl` now honors automerge URLs.

  The package-importing helpers are renamed from `module` to `package`, since they
  resolve a `package.json` entry point: `importModuleFromFolderDocUrl` →
  `importPackageFromFolderDocUrl`, `importModuleFromHttpUrl` →
  `importPackageFromHttpUrl`, and the `ModuleWatcher` `importAutomergeModule` hook
  (with bootloader's `importAutomergeModuleViaWorker`) → `importAutomergePackage`.

## 0.1.3

### Patch Changes

- 0c6177a: An HTTP(S) module URL in a module-settings doc may now point at a site/directory that serves a `package.json` rather than straight at an entry file. When the URL doesn't already name a module file, its `package.json` is fetched and the entry point (`exports`/`main`) resolved and imported. URLs that already point directly at a file still import as-is.

## 0.1.2

### Patch Changes

- 923ad66: Resolve importable URLs against `globalThis.document.baseURI` (falling back to `globalThis.origin`) so they are absolute rather than root-relative.

## 0.1.1

### Patch Changes

- 099e931: Discover a package's plugin descriptors in a dedicated module worker off the
  main thread, then re-import the package (pinned to the same heads) on the main
  thread to run each plugin's real loader. Adds
  `importPluginFromFolderDocUrl(folderDocUrl, pluginType, pluginId)`, which selects
  the plugin by both its `type` and `id` — a plugin `id` is only unique within a
  plugin type, so a package may export e.g. a `patchwork:datatype` and a
  `patchwork:tool` that share the same id.

## 0.0.8

### Patch Changes

- 0101e42: sync versions

## 0.0.6

### Patch Changes

- a847c4f: release

## 0.0.3

### Patch Changes

- e3f41ee: republish broken packages

## 0.0.1

### Patch Changes

- 33681ef: initial release

  making the packages available for the first time on npm
