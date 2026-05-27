---
"@inkandswitch/patchwork-bootloader": minor
---

Wire the new `@inkandswitch/patchwork-providers` element stack into
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
