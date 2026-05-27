---
"@inkandswitch/patchwork-providers-solid": minor
---

Initial release. Solid bindings for the `@inkandswitch/patchwork-providers`
request/respond protocol:

- `request<T>(element, type, args?)` — dispatches a `patchwork:request` on
  mount and returns an `Accessor<T | undefined>` that updates when the
  provider responds.
- `requestDoc<T>(element, type, args?)` — specialized variant for
  responses that resolve to a `DocHandle<T>`; returns
  `[doc, handle]` accessors backed by
  `@automerge/automerge-repo-solid-primitives`' `createDocumentProjection`.
