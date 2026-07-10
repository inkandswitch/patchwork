---
"@inkandswitch/patchwork-bootloader": minor
---

Hash routing: `doc=` now holds the full (un-encoded) automerge URL — heads, if
any, live inside it — and the separate `heads=` param is gone. `doc=` values
that are a bare document id are still accepted for backwards compatibility, and
legacy big-patchwork links (`<slug>--<docId>?…`, including slugs with
characters like `drawing-(branch-1)`) are normalized to `#doc=automerge:<docId>`.
