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

They assert on `window.repo` (set right after the SW relay connects), not on
full UI render: rendering the default frame needs the production Subduction
server to fetch the default-modules doc. Cross-device/server scenarios and
full-render assertions arrive in **Stage B3** once a local Subduction sync
server is wired in.

## Resource note

Config uses a single worker, no parallelism, Chromium only — intentionally
avoiding a swarm of browser/Node processes.
