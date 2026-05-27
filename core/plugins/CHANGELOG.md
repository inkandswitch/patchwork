# @inkandswitch/patchwork-plugins

## 0.0.11

### Patch Changes

- 0101e42: sync versions
- Updated dependencies [0101e42]
  - @inkandswitch/patchwork-filesystem@0.0.8

## 0.0.8

### Patch Changes

- e6afa48: Add `@inkandswitch/patchwork-bootloader/site` entry point exporting
  `bootPatchworkSite(config)`, a full browser-app boot sequence that constructs
  the Repo, wires the service-worker port, loads plugins via the ModuleWatcher,
  resolves the user's account, and installs URL-hash routing + dev globals. This
  lets per-site `main.ts` collapse to a ~10-line config object and keeps two
  sibling sites from drifting apart.

  Also removes the unused `@inkandswitch/patchwork-bootloader` devDependency from
  `@inkandswitch/patchwork-plugins`, which eliminated a cyclic workspace edge.

- a847c4f: release
- Updated dependencies [a847c4f]
  - @inkandswitch/patchwork-filesystem@0.0.6

## 0.0.5

### Patch Changes

- 435e9fe: add doc datatype to setTitle signature

## 0.0.4

### Patch Changes

- fd3dcdb: Make the Tool type generic

  so that the DocHandle has a natural type of the T of Tool<T>

## 0.0.3

### Patch Changes

- Updated dependencies [e3f41ee]
  - @inkandswitch/patchwork-filesystem@0.0.3

## 0.0.2

### Patch Changes

- 1d6e833: rename DataType to Datatype everywhere to be consistent with the id string and the crdt paper
- 1d6e833: warn when plugins are exporting legacy shapes
- 1d6e833: Make the ts interface for the plugins array have the simple names Tool and Datatype

## 0.0.1

### Patch Changes

- 33681ef: initial release

  making the packages available for the first time on npm

- Updated dependencies [33681ef]
  - @inkandswitch/patchwork-filesystem@0.0.1
