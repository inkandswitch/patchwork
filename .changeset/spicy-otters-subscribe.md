---
"@inkandswitch/patchwork-providers": minor
"@inkandswitch/patchwork-providers-solid": minor
---

Add a streaming `subscribe`/`accept` API alongside the existing one-shot
`request`/`provide` path. A consumer calls
`subscribe(element, type, args?, listener)` and gets back an unsubscribe
function; a provider answers with `accept(event, (respond) => teardown)`
and can push values via `respond` for as long as the subscription is live.

Each subscription is carried over its own `MessageChannel` (handed to the
provider via the new `patchwork:subscribe` event's `detail.port`), so there
is no request id to correlate and unsubscribing simply tears down the
channel. `<fallback-provider>` now answers unclaimed subscriptions with a
single `null`. `args` may be any JSON value.

The Solid bindings gain a matching `subscribe(element, type, args?)`
accessor wrapper. The existing `request`/`provide`/`requestDoc` surface is
unchanged.
