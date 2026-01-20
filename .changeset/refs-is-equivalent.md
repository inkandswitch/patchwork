---
"@inkandswitch/patchwork-refs": patch
---

- Add `isEquivalent()` method to compare refs with different addressing (index vs pattern)
- Cache key now includes heads
- `fromUrl` and `fromString` use cached ref factory
