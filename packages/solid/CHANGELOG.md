# @inkandswitch/patchwork-solid

## 0.1.0

### Minor Changes

- 2cbca67: Renamed from the previously-private `@patchwork/solid` and published as a
  standalone package. Solid bindings for the Patchwork plugin registry and
  ref resolution:
  - Plugin/module hooks backed by `@inkandswitch/patchwork-plugins` registries:
    `usePlugins<T>(type)`, `useTools()`, `useDatatypes()`,
    `useFilteredDatatypes(filter)`, `useModules()`, and
    `useSupportedToolsForType(type, { includeUnlisted? })` (the latter shares
    one store/listener per type across all callers).
  - `createShared<V>(factory)` — ref-counted helper that runs `factory(key)`
    once per unique key inside its own reactive root and disposes it when the
    last consumer unmounts.
  - `useResolvedRefs(urls, repo)` and `useResolvedRefMap(urlMap, repo)` —
    resolve `RefUrl`s to `Ref`s via `@automerge/automerge-repo`, with a
    per-hook cache. (Both are slated for removal once subdoc handles let
    parent handles resolve `RefUrl`s synchronously.)
