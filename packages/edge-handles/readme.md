# @inkandswitch/edge-handles

A doc-backed reactive cell with named upstream and downstream connections —
the minimum primitive you need to build dataflow systems where the wires
themselves are first-class, sharable, persistent documents.

EdgeHandles are deliberately **not** transformers. They are the shared
primitive on which transformers, propagators, and other dataflow systems can
be built. The package ships the primitive and a DOM↔handle bridge. Reference
transforms (`identity`, `sum`, `template`, color, markdown, …) live in the
[edge-handles examples tool](../../tools/edge-handles), kept out of the SDK
so consumers ship only what they need.

## Surface

```ts
// "@inkandswitch/edge-handles"

/** Anything URL-addressable with a value-getter and a change subscription.
 *  Both `Ref` and `EdgeHandle` implement it; edges chain into edges. */
interface Handle<T = unknown> {
  readonly url: HandleUrl;
  value(): T;
  onChange(cb: (v: T) => void): () => void;
}

class EdgeHandle<TValue = unknown> implements Handle<TValue | undefined> {
  readonly url: AutomergeUrl;
  readonly doc: DocHandle<EdgeHandleDoc>;

  readonly source:       Record<string, Handle>;
  readonly target:       Record<string, Handle>;
  readonly sourceErrors: Record<string, Error>;
  readonly targetErrors: Record<string, Error>;

  value(): TValue | undefined;
  change(fnOrValue: ChangeFn<TValue> | TValue): void;
  onValueChange(cb: (v: TValue | undefined) => void): () => void;

  onSourceChange(cb: (value: unknown, key: string) => void): () => void;
  onMembersChange(cb: () => void): () => void;
  onAnyChange(cb: (value: unknown, key: string | undefined) => void): () => void;

  setSource(name: string, h: Handle | HandleUrl): void;
  removeSource(name: string): void;
  setTarget(name: string, h: Handle | HandleUrl): void;
  removeTarget(name: string): void;

  persisted(): boolean;
  setPersisted(on: boolean): void;

  destroy(): void;
}

createEdgeHandle<T>(repo, init?): Promise<EdgeHandle<T>>;
findEdgeHandle<T>(repo, url):    Promise<EdgeHandle<T>>;
```

The value side mirrors `Ref`. The wire side is small and explicit: named
maps, four mutators, three subscriptions.

`onSourceChange` only fires on actual per-source value emissions, both args
always defined. `onMembersChange` fires on the initial subscribe and on
source/target membership changes. `onAnyChange` is sugar combining both:
fires on subscribe and on any upstream change, with `(value, key)` set when
a specific source emitted and both `undefined` otherwise.

## Quick taste — three numbers feeding a sum

```ts
import { Repo } from "@automerge/automerge-repo";
import { createEdgeHandle } from "@inkandswitch/edge-handles";

const repo = new Repo();
const a = repo.create({ value: 1 });
const b = repo.create({ value: 2 });
const c = repo.create({ value: 3 });
const total = repo.create({ value: 0 });

const edge = await createEdgeHandle<number>(repo, {
  source: { a: a.ref("value"), b: b.ref("value"), c: c.ref("value") },
  target: { total: total.ref("value") },
});

// Inline transform: re-sum on any upstream signal.
edge.onAnyChange(() => {
  let n = 0;
  for (const src of Object.values(edge.source)) {
    const v = src.value();
    if (typeof v === "number" && Number.isFinite(v)) n += v;
  }
  edge.change(n);
});                                // total.value is now 6
a.change(d => { d.value = 10 });   // total.value becomes 15
```

## Handles

Both `Ref` and `EdgeHandle` implement the `Handle` interface (`url`,
`value()`, `onChange(cb)`). The URL form accepted by `setSource`/`setTarget`
/`createEdgeHandle` is:

- `automerge:abc123` — resolves to `handle.ref()`, the doc's root Ref.
- `automerge:abc123/path...#heads?` — a `RefUrl`, resolves to a path-Ref.
- `automerge:abc123` whose doc has `@patchwork.type === "edge-handle"` —
  resolves to another `EdgeHandle`.

Mutators validate URLs at edit time and throw on malformed input. Failures
during resolution (e.g., a peer doc that hasn't synced yet) are captured in
`edge.sourceErrors` / `edge.targetErrors` rather than silently dropped, and
the next doc tick retries — so a slow-to-arrive peer eventually shows up
without manual re-wiring.

## Persistence

By default an edge is in-memory only — `change()` doesn't touch the doc.
Pass `persist: true` at create time (optionally with a `value`) to mirror
every `change()` back to `doc.value`. Reopening the edge restores the
cached value:

```ts
const edge = await createEdgeHandle<number>(repo, {
  persist: true,
  value: 0,
});
edge.change(42);                // doc.value is now 42
edge.destroy();
const reopened = await findEdgeHandle<number>(repo, edge.url);
reopened.value();               // 42
```

`setPersisted(true | false)` flips the policy at runtime and updates
`persisted()` synchronously.

## Garbage collection

The instance cache holds `WeakRef`s and a `FinalizationRegistry` tears down
doc/endpoint listeners when the edge is collected. You don't need to call
`destroy()` in normal flow — drop your reference and the runtime handles
cleanup. `destroy()` exists for deterministic teardown (tests, hot reloads).

## Subpaths

- [`./dom`](./src/dom.ts) — small bridge helpers for reading handle URLs
  off DOM nodes (`closestHandle`, `handleFromElement`).

Reference transforms (the `identity`, `derive`, `sum`, `template`,
`upper`/`lower`/`slugify`, `markdownToHtml`, `srgbToOklch`/`oklchToSrgb`,
`accumulator`, `streamed` patterns) live in the
[edge-handles examples tool](../../tools/edge-handles/src/patterns) — copy
and adapt freely, but the SDK doesn't ship them.

## Invariants

1. **Handle addressability** — every handle URL resolves to a `Handle`, or
   a typed `Error` lands in `sourceErrors` / `targetErrors`. Mutators reject
   malformed URLs at edit time.
2. **Resolution retries** — while any resolution errors are outstanding,
   the next doc tick re-runs resolution (so still-loading peers eventually
   succeed).
3. **Referential equality (while live)** — `findEdgeHandle(repo, url)`
   returns the same instance for the same `(repo, url)` pair as long as one
   is still in memory. After GC, a fresh instance is constructed
   transparently.
4. **Member-change detection** — doc changes that don't touch `source`/
   `target` (e.g. value-only mirrors) do not re-resolve handles or fire
   `onMembersChange`. Value updates that are structurally equal to the
   cached value don't re-fire `onValueChange` either.
5. **Cycle safety at write time** — a re-entrancy guard inside `change()`
   silently drops nested writes so cycles can't blow the stack. (No edit-
   time cycle rejection; structurally cyclic graphs are allowed.)
6. **Native change semantics** — writes delegate to each target's own
   `change`; no bespoke merge logic. Fan-out is unconditional (including of
   `undefined`) — higher-level semantics belong to consumers.
7. **GC-safe** — unreferenced edges are collected; doc/endpoint listeners
   tear themselves down via the FinalizationRegistry.
