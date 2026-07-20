# Patchwork E2E (Playwright)

Browser + Service-Worker end-to-end tests for the real boot/sync path.

These complement the in-process Vitest sync tests
(`core/filesystem/test/*.test.ts`), which only simulate Tab <-> SW with two
Node `Repo`s over a `MessageChannel`. Here we drive a real Chromium against a
built `patchwork.inkandswitch.com` served by `vite preview`, exercising SW registration,
Wasm init, IndexedDB, and the MessageChannel relay.

## Prerequisites

1. Build the site (the preview server serves `dist/`):

   ```sh
   pnpm --filter patchwork.inkandswitch.com build
   ```

2. Browsers. Either:
   - use the already-cached Playwright browsers, or
   - point at the Nix-provided driver:

     ```sh
     export PLAYWRIGHT_BROWSERS_PATH="$(nix eval --raw nixpkgs#playwright-driver.browsers)"
     ```

   `@playwright/test` is pinned to `1.59.1` to match
   `nixpkgs#playwright-driver` (chromium-1193).

## Run

```sh
pnpm --filter @patchwork/e2e test:e2e          # headless
pnpm --filter @patchwork/e2e test:e2e:headed   # headed
pnpm --filter @patchwork/e2e test:e2e:ui       # Playwright UI
```

Or from the repo root: `pnpm test:e2e` (runs the build first).

## Scope (Stage B1)

Current tests route only through the SW relay + IndexedDB — **no external
Subduction server**:

- `boot.spec.ts` — SW activates and the tab Repo comes up within budget.
- `multi-tab-sync.spec.ts` — a doc created in tab A is found/edited in tab B.
- `reload-persistence.spec.ts` — a doc survives a reload via IndexedDB.
- `closed-tab-persistence.spec.ts` — a doc outlives the tab that created it.
- `offline.spec.ts` — tabs sync with the network cut; the app boots from the
  SW cache offline (skipped on webkit: its offline emulation breaks reload).
- `concurrent-edits.spec.ts` — racing edits from two tabs merge losslessly.
- `base-datatypes.spec.ts` — folder-with-references and collaborative-text
  shapes from patchwork/base round-trip through the relay.

Two suites go beyond B1 and need the network (the base module bundle comes
from netlify), so they're skipped on firefox: Playwright's Firefox build
fails cors fetches made from inside a service worker, and the module bundle
(and with it the frame) never loads.

- `cross-profile-sync.spec.ts` — full UI boot (threepane), a markdown doc
  created via the create-new menu and edited in CodeMirror, synced between
  two browser profiles through the real Subduction server; once against the
  local build, once against the live patchwork.inkandswitch.com.
- `install-tool.spec.ts` — the extensibility loop: a one-file counter module
  (`fixtures/counter.js`) is written into a directory doc, installed from
  its `automerge:` URL through the Packages UI, created via the create-new
  menu, incremented by clicking, and survives a reload.

The offline-reload test flushed out two product fixes: the SW's cache
lookup missed entries when the request was the wasm
`<link rel=preload crossorigin>` (cors mode) rather than a plain fetch, so
offline boot 503'd — it now falls back to a url-keyed match — and hashed
`/assets/*` get `Cache-Control: immutable` (netlify `_headers` + a preview
middleware) so the browser's HTTP cache can serve the shared
automerge-worker's chunk imports offline, which bypass the page's SW.

Heads-up: repeated full-suite runs can get the machine's IP temporarily
rate-limited by netlify (the full-UI tests fetch the whole base module
bundle per boot); the full-UI tests then time out until it lifts.

They assert on `window.repo` (set right after the SW relay connects), not on
full UI render: rendering the default frame needs the production Subduction
server to fetch the default-modules doc. Cross-device/server scenarios and
full-render assertions arrive in **Stage B3** once a local Subduction sync
server is wired in.

## Resource note

Config uses a single worker, no parallelism, Chromium only — intentionally
avoiding a swarm of browser/Node processes.
