---
"@inkandswitch/patchwork-providers": patch
---

Constrain subscription channel values to JSON-serializable data so provider emissions match the structured-clone boundary used by `patchwork:subscribe`.

Export shared `JSONValue`, `JSONObject`, and `JSONArray` types for framework adapters and provider consumers.
