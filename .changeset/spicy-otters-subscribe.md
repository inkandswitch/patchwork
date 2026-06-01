---
"@inkandswitch/patchwork-providers": minor
"@inkandswitch/patchwork-providers-solid": minor
"@inkandswitch/patchwork-providers-react": minor
---

Unify everything on the streaming `subscribe`/`accept` protocol and remove the
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
