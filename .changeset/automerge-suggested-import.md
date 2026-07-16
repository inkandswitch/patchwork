---
"@inkandswitch/patchwork-filesystem": minor
"@inkandswitch/patchwork-elements": minor
"@inkandswitch/patchwork-plugins": minor
"@inkandswitch/patchwork-bootloader": patch
---

A doc's `suggestedImportUrl` may now be an `automerge:` folder-doc URL as well
as an `http(s):` module bundle. When a view finds no built-in tool for a doc, it
loads the suggested module either way. Adds `importPackage` (which dispatches on
the URL scheme) and `isImportableSuggestedUrl` to `patchwork-filesystem`, and
`getSuggestedImportUrl` now honors automerge URLs.

The package-importing helpers are renamed from `module` to `package`, since they
resolve a `package.json` entry point: `importModuleFromFolderDocUrl` →
`importPackageFromFolderDocUrl`, `importModuleFromHttpUrl` →
`importPackageFromHttpUrl`, and the `ModuleWatcher` `importAutomergeModule` hook
(with bootloader's `importAutomergeModuleViaWorker`) → `importAutomergePackage`.
