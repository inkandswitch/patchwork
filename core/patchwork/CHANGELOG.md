# @inkandswitch/patchwork

## 0.1.0

### Minor Changes

- 0aa315d: Configure Subduction or Keyhive with exclusive `syncServers` configuration. `syncServers.keyhive` replaces the `keyhive` and `keyhiveSyncServer` site options and the runtime `setup({ keyhive })` option. Selecting a named ARK relay or providing a custom relay identity and URL enables Keyhive, and configured server URLs now control worker connections as well as connection hints.
- bd63259: New package: one import for a Patchwork site. It owns the boot sequence (`repo`, `router`, `loading`), the vite plugin (config, html, importmap, manifest, netlify, icons, service worker), the site-kit config helpers, and the ambient client types — all previously spread across the bootloader and each site's own `index.html`, `vite.config.ts`, and `public/` directory.

  A site is now a `package.json` dependency, a `vite.config.ts` with `patchwork({...})`, and a `main.ts` that imports `@inkandswitch/patchwork`.

### Patch Changes

- Updated dependencies [0aa315d]
- Updated dependencies [bd63259]
- Updated dependencies [bd63259]
- Updated dependencies [bd63259]
  - @inkandswitch/patchwork-bootloader@0.5.0
  - @inkandswitch/patchwork-elements@4.0.2
  - @inkandswitch/patchwork-filesystem@0.2.3
