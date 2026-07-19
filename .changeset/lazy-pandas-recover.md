---
"@inkandswitch/patchwork-bootloader": patch
"@inkandswitch/patchwork-filesystem": patch
"@inkandswitch/patchwork-plugins": patch
"@inkandswitch/patchwork-providers": patch
---

Reliability and boot-speed fixes:

- The service worker no longer blocks responses on cache writes (they move to
  `waitUntil`), page caching writes its three entries in parallel, non-GET
  requests bypass the worker entirely, cache-write failures (e.g. quota) are
  always logged, the cache is capped at 2000 entries with oldest-first
  trimming, and boot requests persistent storage so cache growth can't trip
  origin-wide eviction of user data.
- `automerge.wasm` is fetched under one URL from both the tab and the
  automerge worker (the `?main`/`?worker` tracing query strings defeated the
  HTTP cache, the SW cache, and the sites' preload — the ~3MB body downloaded
  twice).
- Tabs now recover when the automerge SharedWorker dies or its connection is
  stranded. Previously death was only logged and tabs silently stopped syncing
  until reload. Silence alone never tears anything down (a slow-booting or
  busy worker delivers everything queued once it catches up): a silent port
  first starts a non-destructive probe — a second connection to the same
  instance — and only when the probe gets a `hello` while the original port
  stays silent (proving a live instance with a stranded port) is the worker
  handle recreated, with sync-state subscriptions replayed and every
  subscriber's repo re-wired onto a fresh port. This rescues boots whose
  initial SharedWorker port comes up deaf (~6s), including in hidden
  background tabs; a port `close` event still recovers immediately.
- The worker no longer rescans every doc handle on every
  `subduction-remote-heads` event (quadratic during sync bursts); it tracks
  just the reported doc.
- `ModuleWatcher` announces are generation-tracked, so a stale retry of an
  older module version can no longer land after a newer version and roll the
  registry back.
- `resolveAccountHandle` never overwrites a valid stored account pointer when
  `repo.find` fails: it retries briefly and then throws, instead of silently
  creating a fresh account and orphaning the user's workspace.
- `OverlayRepo` no longer memoizes rejected resolutions: a `find` that failed
  because the doc (or its keyhive access) hadn't synced yet used to pin every
  later `find` of that url to the same cached rejection, so the views' "retry
  once access syncs" recovery could never reach the base repo. Rejections now
  evict and the next `find` re-resolves. `findWithProgress().subscribe` also
  no longer leaks its inner subscription (or fires the callback) when
  unsubscribed before the resolution settles.
