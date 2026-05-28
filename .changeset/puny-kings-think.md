---
"@inkandswitch/patchwork-elements": minor
---

Collapse `<patchwork-view>`'s legacy mode back onto a single DOM node.
Previously, a `<patchwork-view>` carrying `doc-url`/`tool-id` would
delegate to an inner `<patchwork-view-legacy>` child, which broke
event-driven coordination between bootloaders that `dispatchEvent` on
the wrapper and tools that `addEventListener` on their own mount host
(the child) — events dispatched on the wrapper never bubbled _down_ to
the child, and listeners on the child could `stopPropagation` before
ancestors saw the event.

Now `<patchwork-view>` in legacy mode hosts the doc-url/tool-id logic on
itself via a shared `LegacyImpl` class, so the dispatch target and the
tool's mount host are the same node. The wrapper/child split is gone.

- Remove `<patchwork-view-legacy>` and `registerPatchworkViewLegacyElement`,
  plus the `PatchworkViewLegacyElement` type and the
  `patchwork-view-legacy` JSX intrinsic (React, Solid, and global `JSX`).
  Tool render functions should type their element parameter as
  `PatchworkViewElement` (or `ToolElement` from `patchwork-plugins`).
- Extract the doc-url/tool-id render lifecycle into a new internal
  `LegacyImpl` class hosted by `<patchwork-view>`.
- `registerPatchworkViewElement({ hive })` continues to thread `hive`
  through to legacy-mode tools via `element.hive`; only the indirection
  through `registerPatchworkViewLegacyElement` is gone.
