---
"@inkandswitch/patchwork-providers": minor
---

`request` now resolves its context by walking up to the nearest
`<patchwork-view>` ancestor and dispatches (and listens for the response)
from it. Callers can therefore pass any node inside a provider subtree —
typically a component's own ref — instead of threading the host
`patchwork-view` element down through props. When there is no enclosing
view, the request dispatches from the given node and still bubbles,
settling at the `<fallback-provider>` if unanswered.

Target document urls are no longer auto-read from the enclosing view's
`doc-url` attribute; pass them explicitly via `args.url`. The
`url` field on `RequestEventDetail` has been removed — providers should
read `event.detail.args?.url` instead. The built-in `patchwork:dochandle`
provider has been updated accordingly.
