---
"@inkandswitch/patchwork-elements": minor
---

- Reshape `<patchwork-view>` into a dual-mode element. Given a
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
