# @inkandswitch/patchwork-bootloader

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
