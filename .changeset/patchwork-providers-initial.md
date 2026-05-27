---
"@inkandswitch/patchwork-providers": minor
---

Initial release. Adds a small DOM-event based request/respond protocol for
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
