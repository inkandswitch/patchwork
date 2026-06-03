---
"@inkandswitch/patchwork-providers-solid": patch
---

Make `subscribe` preserve top-level provider emission identity by backing it with a Solid signal instead of a reconciled store. This makes subscription accessors work as expected when used as resource or memo sources, where consumers depend on the top-level value changing.

Add `subscribeReconciled` for consumers that explicitly want the previous store-backed behavior with `reconcile` for fine-grained nested updates.
