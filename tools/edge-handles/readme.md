# @inkandswitch/edge-handles-examples

Demo tools and reference transforms built on top of
[`@inkandswitch/edge-handles`](../../packages/edge-handles).

This bundle ships two patchwork tools — `edge-pair` (a side-by-side preview
wired by one edge) and `wired-space` (a spatial canvas where you draw
arrows between docs) — plus a `patterns/` directory of small reference
transforms (`identity`, `sum`, `template`, `markdownToHtml`,
`srgbToOklch`/`oklchToSrgb`, etc.). The SDK itself contains only the
primitive; everything else lives here.

## Tools

### edge-pair

Renders the first two documents in a folder as side-by-side `<patchwork-view>`
panes, then wires them together with an `EdgeHandle`. The attached transform
is selectable from a toolbar.

1. Create a folder.
2. Drop two markdown (or text) docs into it.
3. Open the folder with the **Edge Pair** tool.
4. Type into the left pane. Watch the right pane update in real time.

### wired-space

A spatial canvas of cards (one per doc in the folder) and hyperedge nodes
(one per `EdgeHandle`). Drag from a card's right port to another's left to
wire them. Hover a wire endpoint to see its path; click to edit, alt+click
to detach. Click an edge node to open the inspector and switch transforms.

## Patterns

`src/patterns/` is a library of reference transforms. Each is a small
self-contained file showing the universal `onAnyChange → read sources →
compute → change` loop. Copy and adapt freely.

- `identity` — pass the first source through unchanged.
- `derive` — run a pure projection over named sources.
- `sum` — sum every numeric source.
- `template` — render a template string over named sources.
- `upper` / `lower` / `slugify` — single-source text transforms.
- `markdownToHtml` — render markdown into HTML.
- `srgbToOklch` / `oklchToSrgb` — colour space conversions.
- `accumulator` — fold incoming changes into a running state.
- `streamed` — async with abort-driven latest-wins scheduling.

## Build & deploy

```sh
pnpm install
pnpm push      # builds with vite and runs `pushwork sync`
```

## How it works

```
[ folder doc ]
      │
      ▼
  edge-pair / wired-space tool
   ├─ <patchwork-view> per child doc
   └─ EdgeHandle (a real automerge doc of type "edge-handle")
        source: { src: <ref-url> }
        target: { sink: <ref-url> }
        + a locally-attached transform from ./patterns
```

The `EdgeHandle` persists alongside the source and sink, so the wiring
survives reloads as long as the underlying docs are reachable.
