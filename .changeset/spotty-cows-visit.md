---
"@inkandswitch/patchwork": minor
---

New package: one import for a Patchwork site. It owns the boot sequence (`repo`, `router`, `loading`), the vite plugin (config, html, importmap, manifest, netlify, icons, service worker), the site-kit config helpers, and the ambient client types — all previously spread across the bootloader and each site's own `index.html`, `vite.config.ts`, and `public/` directory.

A site is now a `package.json` dependency, a `vite.config.ts` with `patchwork({...})`, and a `main.ts` that imports `@inkandswitch/patchwork`.
