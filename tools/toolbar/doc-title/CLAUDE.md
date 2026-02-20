# doc-title

## Automerge API notes

- `handle.docSync()` does not exist. Use `handle.doc()` to get the current document synchronously.
- To get a handle, use `await repo.find(url)` — it returns a promise.
- Listen for changes with `handle.on("change", callback)`.
- Make changes with `handle.change(doc => { ... })`.

## Plugin API

- Tool plugins return a `ToolImplementation`: `(handle, element) => () => void`
- The element is a `ToolElement` (HTMLElement with `.repo` attached)
- No need for React — use plain DOM APIs
- To get datatype info, use `getRegistry("patchwork:datatype")` from `@inkandswitch/patchwork-plugins`
