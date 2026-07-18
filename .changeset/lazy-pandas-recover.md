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
  stranded: heartbeat/first-contact detection recreates the worker, replays
  sync-state subscriptions, and re-wires every subscriber's repo onto a fresh
  port. Previously death was only logged and tabs silently stopped syncing
  until reload. A connection that never delivers `hello` is recovered within
  ~5s, which also rescues boots whose initial SharedWorker port comes up deaf.
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
