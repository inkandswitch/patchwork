# @inkandswitch/patchwork-providers-react

## 0.1.0

### Minor Changes

- 76db23e: Initial release. React bindings for the `@inkandswitch/patchwork-providers`
  request/respond protocol:
  - `useRequest<T>(element, type, args?)` — dispatches a `patchwork:request`
    on mount and returns the provider's response as state.
  - `useDocRequest<T>(element, type, args?)` — specialized variant for
    responses that resolve to a `DocHandle<T>`; returns `[doc, handle]`
    matching `useDocument` from `@automerge/automerge-repo-react-hooks`.

### Patch Changes

- Updated dependencies [76db23e]
  - @inkandswitch/patchwork-providers@0.1.0
