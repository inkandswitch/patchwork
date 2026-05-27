# @inkandswitch/patchwork-providers-solid

## 0.1.3

### Patch Changes

- 0101e42: sync versions
- Updated dependencies [0101e42]
  - @inkandswitch/patchwork-providers@0.1.2

## 0.1.0

### Minor Changes

- 76db23e: Initial release. Solid bindings for the `@inkandswitch/patchwork-providers`
  request/respond protocol:
  - `request<T>(element, type, args?)` — dispatches a `patchwork:request` on
    mount and returns an `Accessor<T | undefined>` that updates when the
    provider responds.
  - `requestDoc<T>(element, type, args?)` — specialized variant for
    responses that resolve to a `DocHandle<T>`; returns
    `[doc, handle]` accessors backed by
    `@automerge/automerge-repo-solid-primitives`' `createDocumentProjection`.

### Patch Changes

- Updated dependencies [76db23e]
  - @inkandswitch/patchwork-providers@0.1.0
