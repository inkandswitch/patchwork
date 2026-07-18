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

## WebSocket placement bench (`bench-ws.spec.ts`)

A/B benchmark of the subduction socket living on the automerge SharedWorker
thread ("inline", the old behaviour) vs proxied through a dedicated io
SharedWorker via port donation ("worker"). Skipped unless `RUN_BENCH=1`:

```sh
pnpm bench:ws                        # from the repo root (builds site first)
pnpm --filter @patchwork/e2e bench:report   # aggregate all runs into a table

# knobs (env):
#   BENCH_LOAD_SECONDS   load window per iteration (default 60)
#   BENCH_ITERATIONS     load+measure cycles per arm  (default 3)
#   BENCH_LOAD_DOCS      concurrent churn docs        (default 4)
BENCH_LOAD_SECONDS=120 BENCH_ITERATIONS=5 pnpm bench   # from e2e/
```

Per arm it records, under heavy Automerge churn:

- `driftMs` — lateness of a 1s timer on the worker thread (how late an
  in-thread keepalive would fire). Expected to match across arms; it
  quantifies the hazard the worker arm avoids.
- `propagationMs` — two-tab edit-visibility latency during load.
- `boot` — patchwork boot phases per arm: cold first tab (SW controlled →
  repo ready → root rendered) and second tab against a warm SharedWorker.
- `syncDocs` — the patchwork-level number: writer publishes
  `BENCH_SYNC_DOCS` × `BENCH_SYNC_DOC_KB` docs, then a fresh browser context
  (own IndexedDB, own SharedWorker) resolves all of them through the sync
  server — wall-clock total plus per-doc percentiles.
- `wsEvents` — worker console lines suggesting socket close/reconnect
  (depends on the live sync server; noisy).

Results land in `bench-results/<timestamp>-<mode>.json` (gitignored) and
accumulate across invocations; `bench:report` pools every run per arm and
prints comparison percentiles. Single runs are noise — collect several.
