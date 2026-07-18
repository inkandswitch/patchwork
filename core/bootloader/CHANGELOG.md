# @inkandswitch/patchwork-bootloader

## 0.4.2

### Patch Changes

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

- Updated dependencies [82bee46]
  - @inkandswitch/patchwork-filesystem@0.2.0
  - @inkandswitch/patchwork-elements@4.0.0
  - @inkandswitch/patchwork-plugins@1.0.0

## 0.4.1

### Patch Changes

- Updated dependencies [2d39c84]
  - @inkandswitch/patchwork-providers@0.4.0
  - @inkandswitch/patchwork-elements@3.0.0

## 0.4.0

### Minor Changes

- b1bd763: Hash routing: `doc=` now holds the full (un-encoded) automerge URL — heads, if
  any, live inside it — and the separate `heads=` param is gone. `doc=` values
  that are a bare document id are still accepted for backwards compatibility, and
  legacy big-patchwork links (`<slug>--<docId>?…`, including slugs with
  characters like `drawing-(branch-1)`) are normalized to `#doc=automerge:<docId>`.

## 0.3.2

### Patch Changes

- 0e1eb95: add syncstate info shape

## 0.3.1

### Patch Changes

- 099e931: Discover a package's plugin descriptors in a dedicated module worker off the
  main thread, then re-import the package (pinned to the same heads) on the main
  thread to run each plugin's real loader. Adds
  `importPluginFromFolderDocUrl(folderDocUrl, pluginType, pluginId)`, which selects
  the plugin by both its `type` and `id` — a plugin `id` is only unique within a
  plugin type, so a package may export e.g. a `patchwork:datatype` and a
  `patchwork:tool` that share the same id.
- Updated dependencies [099e931]
  - @inkandswitch/patchwork-filesystem@0.1.1

## 0.2.8

### Patch Changes

- 48e4391: Pass the realm-local `repo` to `<patchwork-view>` registration so booted views
  resolve their document handles through it — via the per-view `OverlayRepo` and
  the root `<repo-provider>` fallback for `repo:handle-descriptor`.
- Updated dependencies [48e4391]
- Updated dependencies [48e4391]
  - @inkandswitch/patchwork-elements@2.0.0
  - @inkandswitch/patchwork-providers@0.3.0

## 0.2.7

### Patch Changes

- 14bd0e2: Don't externalize @automerge/automerge-repo-react-hooks

## 0.2.6

### Patch Changes

- Updated dependencies [db46689]
  - @inkandswitch/patchwork-providers@0.2.0
  - @inkandswitch/patchwork-elements@1.0.0

## 0.2.5

### Patch Changes

- Updated dependencies [f4baf58]
  - @inkandswitch/patchwork-elements@0.2.0

## 0.2.4

### Patch Changes

- Updated dependencies [d9f4650]
- Updated dependencies [e0a7995]
  - @inkandswitch/patchwork-elements@0.1.0

## 0.2.3

### Patch Changes

- 0101e42: sync versions
- Updated dependencies [0101e42]
  - @inkandswitch/patchwork-elements@1.0.3
  - @inkandswitch/patchwork-filesystem@0.0.8
  - @inkandswitch/patchwork-plugins@0.0.11
  - @inkandswitch/patchwork-providers@0.1.2

## 0.2.0

### Minor Changes

- 76db23e: Wire the new `@inkandswitch/patchwork-providers` element stack into
  `bootPatchworkSite`:
  - Register and mount `<repo-provider>` (backed by the booted repo) and a
    top-level `<fallback-provider>` around the configured root element so
    descendant `<patchwork-view>` / `<patchwork-view-legacy>` elements can
    resolve their repo via the request/respond protocol.
  - The single `registerPatchworkViewElement()` call now also registers
    `<patchwork-view-legacy>` (the wrapper's delegation target), so no
    separate registration is needed.
  - Drop the `{ repo }` argument from `registerPatchworkViewLegacyElement`
    (the repo now comes from the provider).
  - Add `@inkandswitch/patchwork-providers` as a workspace dependency.

### Patch Changes

- Updated dependencies [76db23e]
- Updated dependencies [76db23e]
  - @inkandswitch/patchwork-elements@1.0.0
  - @inkandswitch/patchwork-providers@0.1.0

## 0.1.0

### Minor Changes

- e6afa48: Add `@inkandswitch/patchwork-bootloader/site` entry point exporting
  `bootPatchworkSite(config)`, a full browser-app boot sequence that constructs
  the Repo, wires the service-worker port, loads plugins via the ModuleWatcher,
  resolves the user's account, and installs URL-hash routing + dev globals. This
  lets per-site `main.ts` collapse to a ~10-line config object and keeps two
  sibling sites from drifting apart.

  Also removes the unused `@inkandswitch/patchwork-bootloader` devDependency from
  `@inkandswitch/patchwork-plugins`, which eliminated a cyclic workspace edge.

### Patch Changes

- a847c4f: release
- Updated dependencies [e6afa48]
- Updated dependencies [a847c4f]
  - @inkandswitch/patchwork-plugins@0.0.8
  - @inkandswitch/patchwork-elements@0.0.8
  - @inkandswitch/patchwork-filesystem@0.0.6

## 0.0.4

### Patch Changes

- e3f41ee: republish broken packages

## 0.0.1

### Patch Changes

- 33681ef: initial release

  making the packages available for the first time on npm
