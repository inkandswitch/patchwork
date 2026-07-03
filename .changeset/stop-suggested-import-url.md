---
"@inkandswitch/patchwork-bootloader": minor
"@inkandswitch/patchwork-elements": minor
"@inkandswitch/patchwork-filesystem": patch
"@inkandswitch/patchwork-plugins": patch
---

Replace `suggestedImportUrl` with a `package=` hash param.

- Documents created from a datatype no longer stamp `@patchwork.suggestedImportUrl`, and the field/getter are removed from the metadata type. The bootloader no longer loads it.
- Hash routing changes: `doc=` is now the full (un-encoded) automerge URL, the separate `heads=` param is gone, and a new `package=` param records the heads-pinned `importUrl` of the tool actually rendering the top-level document. On load the bootloader preloads `package=` so shared links resolve their tool even when it isn't in the user's module settings. `package=` is written with `history.replaceState` so it doesn't add a history entry.
- `MountedEvent` now carries the in-use tool's `importUrl`.
