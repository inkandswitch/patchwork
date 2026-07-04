---
"@inkandswitch/patchwork-filesystem": patch
---

Resolve importable URLs against `globalThis.document.baseURI` (falling back to `globalThis.origin`) so they are absolute rather than root-relative.
