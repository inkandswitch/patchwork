---
"@inkandswitch/patchwork-bootloader": minor
---

Wire the new `@inkandswitch/patchwork-providers` element stack into
`bootPatchworkSite`:

- Register and mount `<repo-provider>` (backed by the booted repo) and a
  top-level `<fallback-provider>` around the configured root element so
  descendant `<patchwork-view>` / `<patchwork-component>` elements can
  resolve their repo via the request/respond protocol.
- Register the new `<patchwork-component>` element in addition to
  `<patchwork-view>`, and drop the `{ repo }` argument from
  `registerPatchworkViewElement` (the repo now comes from the provider).
- Add `@inkandswitch/patchwork-providers` as a workspace dependency.
