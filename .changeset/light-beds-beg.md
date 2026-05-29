---
"@inkandswitch/patchwork-elements": minor
---

Add a `LegacyPatchworkViewElement` type for tools hosted in legacy
(`doc-url` / `tool-id`) mode. Unlike the component-mode
`PatchworkViewElement`, it always carries the resolved `repo` and
optionally a `hive`, so legacy tools can read both off their mount host
without casting.

Relax the `<patchwork-view>` JSX attribute types: component mode now
accepts `doc-url` / `tool-id` as passthrough data for the mounted
component, and the Solid intrinsic extends `HTMLAttributes` so standard
element props type-check. Renames the internal `PatchworkViewLegacyAttrs`
to `LegacyPatchworkViewAttrs` for consistency.
