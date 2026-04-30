---
"@inkandswitch/patchwork-bootloader": minor
"@inkandswitch/patchwork-plugins": patch
---

Add `@inkandswitch/patchwork-bootloader/site` entry point exporting
`bootPatchworkSite(config)`, a full browser-app boot sequence that constructs
the Repo, wires the service-worker port, loads plugins via the ModuleWatcher,
resolves the user's account, and installs URL-hash routing + dev globals. This
lets per-site `main.ts` collapse to a ~10-line config object and keeps two
sibling sites from drifting apart.

Also removes the unused `@inkandswitch/patchwork-bootloader` devDependency from
`@inkandswitch/patchwork-plugins`, which eliminated a cyclic workspace edge.
