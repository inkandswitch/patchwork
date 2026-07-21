---
"@inkandswitch/patchwork": minor
---

`setup()` now uses `packageListURL` as given instead of letting `localStorage.systemPackageListURL` silently replace it. A site that wants a dev override resolves it itself and passes the result in:

```ts
const packageListURL =
  new URLSearchParams(location.search).get("system-package-list") ||
  localStorage.getItem("systemPackageListURL") ||
  DEFAULT_PACKAGE_LIST;
```

This keeps the precedence in one place — the site — so a site can add its own override sources without fighting the library for priority.
