---
"@inkandswitch/patchwork-filesystem": patch
---

An HTTP(S) module URL in a module-settings doc may now point at a site/directory that serves a `package.json` rather than straight at an entry file. When the URL doesn't already name a module file, its `package.json` is fetched and the entry point (`exports`/`main`) resolved and imported. URLs that already point directly at a file still import as-is.
