---
"@inkandswitch/patchwork-elements": minor
---

- Add a new `<patchwork-component>` custom element
  (`registerPatchworkComponentElement`) for mounting plugin-defined
  components by id, alongside the existing `<patchwork-view>`.
- Emit a new `patchwork:unmounted` event (with `MountedEventDetail`-shaped
  payload) when a `<patchwork-view>` or `<patchwork-component>` tears
  down, mirroring `patchwork:mounted`. `MountedEventDetail` is now a union
  covering both view (`{ url, toolId }`) and component
  (`{ componentId }`) mounts.
- Extend the `elements.d.ts` JSX intrinsic-element augmentations to cover
  the new `patchwork-component` element alongside `patchwork-view`, for
  React, Solid, and the global `JSX` namespace.
- Add `@inkandswitch/patchwork-providers` and optional `react` /
  `solid-js` / `@types/react` peer dependencies; `registerPatchworkViewElement`
  no longer takes a `{ repo }` argument and instead resolves the repo
  through an ancestor `<repo-provider>`.
