# @inkandswitch/patchwork-elements

## 1.0.3

### Patch Changes

- 0101e42: sync versions
- Updated dependencies [0101e42]
  - @inkandswitch/patchwork-filesystem@0.0.8
  - @inkandswitch/patchwork-plugins@0.0.11
  - @inkandswitch/patchwork-providers@0.1.2

## 1.0.0

### Minor Changes

- 76db23e: - Reshape `<patchwork-view>` into a dual-mode element. Given a
  `component` attribute, it mounts a registered `patchwork:component`
  plugin in place (formerly the job of the now-removed
  `<patchwork-component>` element). Given the legacy `doc-url` /
  `tool-id` attributes (and no `component`), it transparently delegates
  to an inner `<patchwork-view-legacy>` that preserves the original
  doc-url/tool-id-driven behavior — including tool registry lookups,
  `@patchwork.fallbackToolId` resolution, and the `patchwork:no-tool`
  event. The element type is now `PatchworkViewElement` (the wrapper);
  tool render functions that need the document-bound host should type
  it as `PatchworkViewLegacyElement`.
  - Add `registerPatchworkViewLegacyElement` exposing the legacy element
    under its own name (`<patchwork-view-legacy>`) for code that wants to
    bypass the wrapper.
  - `registerPatchworkViewElement` now accepts a `hive` option that is
    forwarded to the inner `<patchwork-view-legacy>` registration, so
    Keyhive-enabled sites can wire `hive` through a single call.
  - Remove `registerPatchworkComponentElement` and the
    `<patchwork-component>` element; use `<patchwork-view component="...">`
    instead.
  - Emit a new `patchwork:unmounted` event (with `MountedEventDetail`-shaped
    payload) when a `<patchwork-view>` or `<patchwork-view-legacy>` tears
    down, mirroring `patchwork:mounted`. `MountedEventDetail` is now a
    union covering both view (`{ url, toolId }`) and component
    (`{ componentId }`) mounts.
  - Update the `elements.d.ts` JSX intrinsic-element augmentations: the
    single `patchwork-view` entry is now a discriminated union of legacy
    (`doc-url` / `tool-id`) and component (`component` / `url`)
    attribute sets — setting attributes from both modes on the same
    `<patchwork-view>` is a compile-time error. `patchwork-view-legacy`
    is exposed as a separate intrinsic for direct use. Applies to React,
    Solid, and the global `JSX` namespace.
  - Add `@inkandswitch/patchwork-providers` and optional `react` /
    `solid-js` / `@types/react` peer dependencies;
    `registerPatchworkViewLegacyElement` no longer takes a `{ repo }`
    argument and instead resolves the repo through an ancestor
    `<repo-provider>`.

### Patch Changes

- Updated dependencies [76db23e]
  - @inkandswitch/patchwork-providers@0.1.0

## 0.0.8

### Patch Changes

- a847c4f: release
- Updated dependencies [e6afa48]
- Updated dependencies [a847c4f]
  - @inkandswitch/patchwork-plugins@0.0.8
  - @inkandswitch/patchwork-filesystem@0.0.6

## 0.0.5

### Patch Changes

- Updated dependencies [435e9fe]
  - @inkandswitch/patchwork-plugins@0.0.5

## 0.0.4

### Patch Changes

- Updated dependencies [fd3dcdb]
  - @inkandswitch/patchwork-plugins@0.0.4

## 0.0.3

### Patch Changes

- Updated dependencies [e3f41ee]
  - @inkandswitch/patchwork-filesystem@0.0.3
  - @inkandswitch/patchwork-plugins@0.0.3

## 0.0.2

### Patch Changes

- 1d6e833: Make the ts interface for the plugins array have the simple names Tool and Datatype
- Updated dependencies [1d6e833]
- Updated dependencies [1d6e833]
- Updated dependencies [1d6e833]
  - @inkandswitch/patchwork-plugins@0.0.2

## 0.0.1

### Patch Changes

- 33681ef: initial release

  making the packages available for the first time on npm

- Updated dependencies [33681ef]
  - @inkandswitch/patchwork-filesystem@0.0.1
  - @inkandswitch/patchwork-plugins@0.0.1
