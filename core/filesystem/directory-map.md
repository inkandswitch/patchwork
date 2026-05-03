# the directory map strategy

```json
{
  "@patchwork": { "type": "directory" },
  "main/dist/index.js": "automerge:abc123"
}
```

```json
{
  "@patchwork": { "type": "directory" },
  "main": {
    "dist": {
      "index.js": "automerge:abc123"
    }
  }
}
```

a directory is a doc with `@patchwork.type === "directory"`. paths can be flat keys, nested keys, or a mix.

## walking the path

fetching `automerge:DIR_URL/main/dist/index.js` walks `["main", "dist", "index.js"]` by longest prefix:

1. key `"main/dist/index.js"` → use it, parts is `[]`
2. key `"main/dist"` → descend, parts is `["index.js"]`
3. key `"main"` → descend, parts is `["dist", "index.js"]`

flat keys win when present. nested objects work too. `{"main/dist": {"index.js": ...}}` works.

## following urls

at any node, a value that's an automerge url is followed. each follow re-dispatches through the strategy picker — a directory can point at a folder, a folder at a directory, a file.

cycle detection isn't done here. the service worker has a 5s timeout; that's the backstop.

## the result

`resolvePath` returns `{ content: string | Uint8Array, type: string }` — ready to drop into a `Response`.

when path runs out, the current value is materialized:

- `Uint8Array` → as-is, type defaults to `application/octet-stream`
- `FileDoc`-shape (`{ content, mimeType? }`) → recurse on `.content` with `.mimeType` as the type hint
- automerge url → follow, materialize the doc it points at
- string with a type hint in scope → as-is with that type
- string without a hint → `JSON.stringify` so it's valid json; type `application/json`
- `ImmutableString` → unwrapped to string, same rules
- number, boolean, plain object, array → `JSON.stringify`; type from hint or `application/json`

a hint comes from a `FileDoc`'s `.mimeType` higher in the chain. a js file stored as `{ content: "console.log()", mimeType: "text/javascript" }` keeps its content as-is; a directory leaf with a raw string and no hint becomes valid json.

## what it doesn't do

no `package.json` awareness. the folder strategy handles that. for export resolution, resolve in the tab and fetch the literal path.
