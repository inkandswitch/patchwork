# @inkandswitch/patchwork-providers

## 0.4.0

### Minor Changes

- 2d39c84: `accept`'s `respond` callback now takes an optional `Transferable[]` second argument, forwarded to `MessagePort.postMessage` so a provider can transfer objects (e.g. a `MessagePort` or `ArrayBuffer`) to the consumer instead of structured-cloning them.

## 0.3.0

### Minor Changes

- 48e4391: Add an `OverlayRepo` layer so document resolution can be remapped across
  provider scopes (e.g. to a draft/branch clone) without sending a live `Repo` or
  `DocHandle` over the provider boundary.
  - `OverlayRepo` is a realm-local `RepoLike` shim whose `find` /
    `findWithProgress` dispatch a `repo:handle-descriptor` subscription, resolve the
    returned `cloneUrl ?? url` against the realm-local base repo, and hand back an
    `OverlayHandle`. Every other method forwards to the base repo unchanged.
  - `OverlayHandle` is a url-hiding proxy around a fixed backing `DocHandle`:
    `url` / `documentId` keep reporting the originally requested url, all other
    operations forward to the backing (clone) handle, and forwarded events are
    re-stamped so consumers never observe the backing handle.
  - A remapper answers the `repo:handle-descriptor` subscription with a
    `DocHandleDescriptor` (`{ url, cloneUrl? }`) — plain, structured-cloneable
    data, never a live handle.
  - `<repo-provider>` now acts as the root-level fallback answerer for
    `repo:handle-descriptor`, resolving a requested url to itself (no clone) so a
    view rendered outside any remapper still resolves and the overlay's `find`
    never hangs.

  New exports: `OverlayRepo`, `OverlayHandle`, `DocHandleDescriptor`, and
  `OverlayHandleOpts`.

## 0.2.2

### Patch Changes

- 5eafe78: Constrain subscription channel values to JSON-serializable data so provider emissions match the structured-clone boundary used by `patchwork:subscribe`.

  Export shared `JSONValue`, `JSONObject`, and `JSONArray` types for framework adapters and provider consumers.

## 0.2.1

### Patch Changes

- 68374f4: Constrain subscription channel values to JSON-serializable data so provider emissions match the structured-clone boundary used by `patchwork:subscribe`.

  Export shared `JSONValue`, `JSONObject`, and `JSONArray` types for framework adapters and provider consumers.

## 0.2.0

### Minor Changes

- db46689: Unify everything on the streaming `subscribe`/`accept` protocol and remove the
  one-shot `request`/`provide` event machinery.
  - A consumer calls `subscribe(element, selector, listener)` and gets back an
    unsubscribe function; a provider answers with `accept(event, (respond) =>
teardown)` and can push values via `respond` for as long as the subscription
    is live. Subscriptions are keyed on a `Selector` — a JSON object that always
    carries a `type` discriminant plus any subscription-specific fields (e.g.
    `{ type: "patchwork:comments", url }`), so it survives the structured clone
    across the `patchwork:subscribe` event boundary.
  - `request(element, selector)` is now a thin convenience wrapper over
    `subscribe`: it resolves with the first emitted value and immediately
    unsubscribes. `provide`, the `patchwork:request`/`patchwork:response` events
    and their detail types have been removed.
  - The `<fallback-provider>` element is gone. Unclaimed selectors are simply
    never answered (no `null` settlement), so `request` for an unanswered
    selector never resolves — use `subscribe` if you need to handle "no
    provider".
  - Values cross the channel structured-cloned, so `DocHandle`s and `Repo`s can
    no longer be sent. The repo is published as a global (`globalThis.repo`) and
    read back via the new `getRepo()` helper; providers emit an `AutomergeUrl`
    and consumers recover the live `DocHandle` locally.

  The Solid bindings gain `subscribe(element, selector, initialValue?)` (backed
  by a store + `reconcile`) and `subscribeDoc(element, selector)` which recovers
  `[doc, handle]` from the global repo. The React bindings gain matching
  `useSubscribe` and `useSubscribeDoc` hooks. The old `requestDoc` /
  `useDocRequest` handle-request helpers are replaced by these.

## 0.1.2

### Patch Changes

- 0101e42: sync versions

## 0.1.0

### Minor Changes

- 76db23e: Initial release. Adds a small DOM-event based request/respond protocol for
  Patchwork providers:
  - `request(element, type, args?)` / `provide(event, value)` helpers that
    dispatch `patchwork:request` and listen for `patchwork:response` along
    the DOM tree.
  - `<repo-provider>` custom element (`registerRepoProviderElement`) that
    exposes an `automerge-repo` `Repo` and resolves `getRepo` / `findDocument`
    requests from descendant elements.
  - `<fallback-provider>` custom element (`registerFallbackProviderElement`)
    that answers any unhandled request with `null` so consumers can rely on
    a terminating response.
  - `RepoLike` type for embedders that want to back the provider with a
    custom repo-shaped object.
