---
"@inkandswitch/patchwork-bootloader": minor
---

Move the site boot sequence and the vite plugin out to `@inkandswitch/patchwork`. The `./site` and `./vite` exports are gone; import from `@inkandswitch/patchwork` and `@inkandswitch/patchwork/vite` instead.

Split the externals list into `./externals-list` so the list can be read without pulling in node builtins, and export `resolveExternal` and the wasm asset emitter so another package's vite plugin can resolve the bootloader's own dependencies from the bootloader's `node_modules`. Export `./global.css` and `./module-loader`.

Fall back to a url-keyed cache lookup in the service worker when the request-keyed one misses, so a cors request (the wasm `<link rel=preload crossorigin>`) still hits the cache offline.
