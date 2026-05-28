---
"@inkandswitch/patchwork-bootloader": patch
---

Drop the `<patchwork-view-legacy>` reference from this package's CHANGELOG
notes. The wrapper/child split in `<patchwork-view>` has been removed in
`@inkandswitch/patchwork-elements`, so descendant lookups documented as
landing on `<patchwork-view-legacy>` now land on `<patchwork-view>`
directly. No bootloader code change — the symbols never lived here.
