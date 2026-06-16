---
"@inkandswitch/patchwork-providers": minor
---

Add an `OverlayRepo` layer so document resolution can be remapped across
provider scopes (e.g. to a draft/branch clone) without sending a live `Repo` or
`DocHandle` over the provider boundary.

- `OverlayRepo` is a realm-local `RepoLike` shim whose `find` /
  `findWithProgress` dispatch a `patchwork:dochandle` subscription, resolve the
  returned `cloneUrl ?? url` against the realm-local base repo, and hand back an
  `OverlayHandle`. Every other method forwards to the base repo unchanged.
- `OverlayHandle` is a url-hiding proxy around a fixed backing `DocHandle`:
  `url` / `documentId` keep reporting the originally requested url, all other
  operations forward to the backing (clone) handle, and forwarded events are
  re-stamped so consumers never observe the backing handle.
- A remapper answers the `patchwork:dochandle` subscription with a
  `DocHandleDescriptor` (`{ url, cloneUrl? }`) — plain, structured-cloneable
  data, never a live handle.
- `<repo-provider>` now acts as the root-level fallback answerer for
  `patchwork:dochandle`, resolving a requested url to itself (no clone) so a
  view rendered outside any remapper still resolves and the overlay's `find`
  never hangs.

New exports: `OverlayRepo`, `OverlayHandle`, `DocHandleDescriptor`, and
`OverlayHandleOpts`.
