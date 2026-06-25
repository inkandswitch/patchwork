# Troubleshooting Patchwork

Patchwork runs across three browser contexts (a tab, a SharedWorker, and a service worker) and stores everything locally in IndexedDB, so when something goes wrong it is rarely obvious _where_. This guide explains how to capture a **diagnostics bundle** with the built-in exporter, and how to read one.

- [Capture a bundle (for whoever hit the problem)](#capture-a-bundle)
- [Host diagnostics (OS, disk, RAM, CPU, GPU)](#host-diagnostics)
- [Reporting a problem](#reporting-a-problem)
- [Clearing stored data](#clearing-stored-data)
- [What's in the bundle](#whats-in-the-bundle)

## Capture a bundle

Open the browser devtools console on the affected tab and run:

```js
await window.patchworkDiagnostics.export();
```

This collects state from all three contexts, packages it into a single `.zip`, and downloads it to your Downloads folder as `patchwork-diagnostics-<site>-<keyprefix>-<timestamp>.zip`. Send that file to whoever is debugging.

> [!WARNING]
> The bundle contains your **full document contents**, your **complete `localStorage`**, and your **private Ed25519 signing key** (the `subduction-signer` store). Anyone who has it can read all your data and impersonate you. Treat it like a password: only share it over a trusted channel, and never commit it or post it publicly. The exporter prints this same warning to the console.

Notes:

- `window.patchworkDiagnostics` is installed _early_ in boot — before the steps that can hang — so the exporter still works when the app is wedged on a blank page.
- If the download was blocked (some browsers throttle programmatic downloads), re-trigger it with `window.patchworkDiagnostics.redownload()`.
- The export reads the whole local store, so on a large profile it can pause the tab for several seconds (it scales with how much you have stored). This is expected.

## Host diagnostics

The browser is sandboxed from the machine, so the bundle cannot see disk space, RAM, swap, or CPU/GPU load. When those matter (a slow or low-memory machine, "running out of space", a pegged GPU), run the companion script and send its output _alongside_ the bundle:

```shell
scripts/host-diagnostics.sh          # prints a report and saves a timestamped .txt
```

It captures, best-effort and cross-platform (Linux + macOS), never failing on a missing tool:

- OS / kernel / distro, hostname, uptime + load average
- disk: total / used / available for `/` and `$HOME`
- memory: total / used / free RAM, plus swap
- CPU: core count and current utilization (sampled over 0.5 s)
- GPU: utilization via `nvidia-smi`, or AMD `gpu_busy_percent` (best-effort; macOS/Intel need elevated tools and are noted rather than guessed)

Options: `-o FILE` to choose the output path, `--stdout` to print only, `-h` for help. Unlike the browser bundle, this snapshot holds no documents or keys — it is safe to share freely.

## Reporting a problem

A few quick checks narrow things down fast — and a couple of them (a fresh profile, a second browser) are often the difference between "the whole app is broken" and "this one document won't open".

Things to try:

- [ ] Is it one specific document, or everything?
- [ ] Reload the page, then try a hard reload (bypass cache).
- [ ] Reproduce in a separate, normal browser profile (not a private/incognito window).
- [ ] Were you online? Did it start after an update, going offline, or filling the disk?

What to attach:

- [ ] Diagnostics bundle — `await window.patchworkDiagnostics.export()` (see [Capture a bundle](#capture-a-bundle)).
- [ ] Host diagnostics — `scripts/host-diagnostics.sh`, if it might be machine-related (slow, low memory or disk). Safe to share.

Copy-paste report template:

```text
What I was doing:
What I expected:
What happened instead:
One document or all of them:
Affected document URL (include the #doc=… fragment):
First seen / how often:
Opened in another browser, NOT incognito:   worked / failed / didn't try
Tried a fresh browser profile:              worked / failed / didn't try
Attached:  [ ] diagnostics bundle   [ ] host-diagnostics.txt
```

## Clearing stored data

Two console commands selectively clear the local Automerge store (`automerge/documents`). Both leave your signing key (the `subduction-signer` database) and logs (`patchwork-logs-*`) untouched, both return `{ deleted, kept }` counts, and both need a reload afterwards — the SharedWorker holds repo and Subduction state in memory, so the reload is what brings storage and the worker back into sync.

Drop Subduction's store (loose commits, blobs, fragments). It accumulates to hundreds of MB and slows hydration, so if a bundle shows `idb/automerge.documents` dominated by `subduction/*` records this reclaims that space. The data re-fetches from the sync server, so it is recoverable, and your documents are left intact:

```js
await window.dropSubductionStorage();
```

Drop the Automerge document chunks (the materialized document data), leaving the Subduction log intact so synced documents re-materialize from it and the sync server on reload. Use this to reset corrupt local document state:

```js
await window.dropAutomergeStorage();
```

> [!WARNING]
> `dropAutomergeStorage()` is destructive — it removes local document data. Documents that are synced come back on reload, but treat it as a reset, not a cleanup.

## What's in the bundle

```
patchwork-diagnostics-<site>-<keyprefix>-<timestamp>.zip
├── manifest.json                         the summary — start here
├── logs/
│   ├── tab.log                           main-thread console + breadcrumbs
│   ├── worker.log                        automerge SharedWorker
│   └── sw.log                            service worker (cache + fetch)
└── idb/
    ├── <db>.<store>.index.json           record structure (see below)
    ├── <db>.<store>.bin                  raw binary blobs, concatenated
    └── …                                 one pair per IndexedDB object store
```

`manifest.json` sections:

| Section                             | Contents                                                                                                                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schemaVersion`, `binFormatVersion` | bundle + `.bin` format versions                                                                                                                                                  |
| `generatedAt`, `generationMs`       | when the export ran, and how long it took                                                                                                                                        |
| `environment`                       | time + timezone, browser/OS, screen, `storage.estimate()` (usage/quota/persisted), JS heap, support flags (SharedWorker, COI…), full `localStorage`, service-worker registration |
| `tabRepo`                           | the tab's repo: `peerId`, `peers`, loaded handle count + per-handle state/heads                                                                                                  |
| `worker`                            | the SharedWorker's repo, sync endpoints, public `verifyingKey`, keyhive flag (logs are in `logs/worker.log`, not here)                                                           |
| `serviceWorker`                     | cache name/version, cache entry counts                                                                                                                                           |
| `modules`                           | configured module-settings sources and their module lists                                                                                                                        |
| `plugins`                           | registered tools/datatypes/components by type                                                                                                                                    |
| `idb`                               | every IndexedDB database dumped, with per-store record counts and byte sizes                                                                                                     |
| `logs`                              | per-context entry counts (full text is in `logs/*.log`)                                                                                                                          |
| `collectionErrors`                  | anything that failed _during_ collection (should be empty)                                                                                                                       |

The decoder lives in `core/bootloader/src/idb-dump.ts` (`decodeStoreDump(records, bin)`).
