---
"@inkandswitch/patchwork-elements": minor
---

Resolve a `<patchwork-view>`'s primary document handle through a realm-local
`repo` instead of a global `window.repo`, and make legacy-tool resolution
remappable via `OverlayRepo`.

Breaking: `registerPatchworkViewElement` now requires a `repo` (its params
argument is no longer optional), and `ComponentRender` callbacks now receive a
second `repo` argument.

- `registerPatchworkViewElement` now requires a realm-local `repo`. Each view
  wraps it in an `OverlayRepo` (exposed as `element.repo`) so legacy-mode tools
  resolve their primary handle through the remapping shim (e.g. to a draft
  clone), while components receive the base repo directly.
- `ComponentRender` now receives the base repo as a second argument:
  `(element, repo) => () => void`. Components get the base repo (not the
  overlay) so providers can clone/create against the real repo without
  re-entering their own remapping.
- `LegacyImpl` takes a required `repo` and resolves its handle through it,
  replacing the previous `globalThis.repo` lookup.
