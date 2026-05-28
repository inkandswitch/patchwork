---
"@inkandswitch/patchwork-elements": minor
---

Reshape `<patchwork-view>` into a dual-mode element.

The component-attribute mode (`<patchwork-view component="..." url="...">`)
is the supported path going forward. The `doc-url` / `tool-id` mode is a
deprecated migration bridge: every behavior it carries — tool registry
lookups, `@patchwork.fallbackToolId` resolution, the `patchwork:no-tool`
event, and the `LegacyImpl` plumbing that backs it — will be removed in
a future major once consumers have moved to `patchwork:component`-based
tools mounted via the `component` attribute. New code should not adopt
`doc-url` / `tool-id`.

Caveat: component mode currently only mounts `patchwork:component`
plugins. It does not yet drive `patchwork:tool` plugins the way legacy
mode does (tool-registry lookup by id, `@patchwork.fallbackToolId`
resolution, `patchwork:no-tool` event). That tool-loading path will be
folded into component mode in a future release; until then, anything
that mounts a `patchwork:tool` still has to go through `doc-url` /
`tool-id`.

- `<patchwork-view>` now reacts to whichever attributes it carries.
  Given a `component` attribute (with an optional `url`), it mounts a
  registered `patchwork:component` plugin in place. Given the legacy
  `doc-url` / `tool-id` attributes (and no `component`), it drives the
  original tool-mounting lifecycle on itself via an internal
  `LegacyImpl` class. `component` wins if both are set.
- Remove `registerPatchworkComponentElement` and the
  `<patchwork-component>` element; use `<patchwork-view component="...">`
  instead.
- Emit a new `patchwork:unmounted` event (with `MountedEventDetail`-shaped
  payload) when a `<patchwork-view>` tears down, mirroring
  `patchwork:mounted`. `MountedEventDetail` is now a union covering
  both view (`{ url, toolId }`) and component (`{ componentId }`)
  mounts.
- Update the `elements.d.ts` JSX intrinsic-element augmentations: the
  `patchwork-view` entry is now a discriminated union of legacy
  (`doc-url` / `tool-id`) and component (`component` / `url`) attribute
  sets — setting attributes from both modes on the same
  `<patchwork-view>` is a compile-time error. Applies to React, Solid,
  and the global `JSX` namespace.
- Add `@inkandswitch/patchwork-providers` as a dependency and
  `react` / `solid-js` / `@types/react` as optional peers; legacy-mode
  rendering resolves the repo through an ancestor `<repo-provider>`
  instead of taking a `{ repo }` argument.
- Tool render functions should type their element parameter as
  `PatchworkViewElement` (or `ToolElement` from `patchwork-plugins`).
