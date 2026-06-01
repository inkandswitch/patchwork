---
"@inkandswitch/patchwork-providers": minor
"@inkandswitch/patchwork-providers-solid": minor
---

Add a streaming `subscribe`/`accept` API alongside the existing one-shot
`request`/`provide` path. A consumer calls `subscribe(element, selector,
listener)` and gets back an unsubscribe function; a provider answers with
`accept(event, (respond) => teardown)` and can push values via `respond` for
as long as the subscription is live.

A subscription is keyed on a `Selector` — a JSON object that always carries a
`type` discriminant plus any subscription-specific fields (e.g.
`{ type: "patchwork:comments", url }`). Being JSON, it survives the structured
clone across the event boundary.

Each subscription is carried over its own `MessageChannel` (handed to the
provider via the new `patchwork:subscribe` event's `detail.port`), so there
is no request id to correlate and unsubscribing simply tears down the
channel. Unlike `request`, an unclaimed subscription is never settled — if no
provider answers it simply never emits.

The Solid bindings gain a matching `subscribe(element, selector, initialValue?)`
accessor wrapper, backed by a store + `reconcile` for granular updates and
accepting an `initialValue` to seed the accessor before the first emission.
The existing `request`/`provide`/`requestDoc` surface is unchanged.
