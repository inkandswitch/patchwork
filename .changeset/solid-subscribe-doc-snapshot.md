---
"@inkandswitch/patchwork-providers-solid": patch
---

Fix `subscribeDoc` corrupting the mirrored document on whole-value writes. It
now reconciles the Solid store against the materialized `handle.doc()` snapshot
on every change instead of replaying incremental patches via
`createDocumentProjection`. Replaying the patch stream double-applied
`putObjectFromHydrate` writes (e.g. `doc.list = [...]` yielded `[a, b, a, b]`);
reconciling against the authoritative snapshot is robust to any valid change.
