---
"@inkandswitch/patchwork-providers": minor
"@inkandswitch/patchwork-providers-solid": minor
"@inkandswitch/patchwork-providers-react": minor
"@inkandswitch/patchwork-elements": minor
"@inkandswitch/patchwork-bootloader": minor
---

Unify provider communication around streaming `subscribe`/`accept` channels and
plain structured data, replacing the one-shot `request`/`provide` event API.

## New `subscribe` / `accept` API

The old provider API resolved a single value for a string request type:

```ts
const handle = await request<DocHandle<TaskDoc>>(
  element,
  "patchwork:dochandle",
  { url }
);

element.addEventListener("patchwork:request", (event) => {
  if (event.detail.type !== "patchwork:dochandle") return;
  provide(event, repo.find(event.detail.args?.url as AutomergeUrl));
});
```

That worked when the value was resolved once and all future reactivity came
from the returned object, such as a `DocHandle`. It did not work for providers
that need to swap the underlying handle later, and it was inconsistent about
what crossed the event boundary: some requests still returned live objects like
`Repo` or `DocHandle`, which cannot be transferred across realms.

The new API opens a `MessageChannel`-backed subscription keyed by a structured
`Selector`. Providers answer with `accept(event, callback)`, push any number of
plain values through `respond`, and optionally return a teardown. Values sent
through `respond` must be structured-cloneable: no `DocHandle`s, `Repo`s, class
instances, or other live objects cross the provider boundary anymore.

```ts
const unsubscribe = subscribe<CommentThread[]>(
  element,
  { type: "patchwork:comments", url },
  (threads) => setThreads(threads)
);

element.addEventListener("patchwork:subscribe", (event) => {
  if (event.detail.selector.type !== "patchwork:comments") return;

  accept<CommentThread[]>(event, (respond) => {
    const publish = () => respond(readCommentThreads(url));
    publish();
    return commentStore.on("change", publish);
  });
});
```

Selectors are JSON-like objects with a `type` discriminant, for example
`{ type: "patchwork:comments", url }`, so selector arguments survive structured
clone. `request(element, selector)` remains as a convenience wrapper: it opens a
subscription, resolves with the first emitted value, and immediately
unsubscribes.

## Handling Repo and Doc Handles

We still need a way to provide `DocHandle` and `Repo`, but
those objects are not safe to send through the provider channel. The general
strategy is to send structured data, usually an `AutomergeUrl`, and recover the
live object locally from the realm-local repo.

React and Solid now expose document-specific helpers for subscriptions whose
provider emits an `AutomergeUrl`:

```tsx
const [doc, handle] = useSubscribeDoc<TaskDoc>(element, {
  type: "patchwork:selected-doc",
  url,
});
```

```ts
const [doc, handle] = subscribeDoc<TaskDoc>(() => element, {
  type: "patchwork:selected-doc",
  url,
});
```

The lower-level subscription can emit the URL as plain data:

```ts
accept<AutomergeUrl>(event, (respond) => {
  respond(selectedDocUrl);
  return selectionStore.on("change", () => respond(selectedDocUrl));
});
```

Repo access needs an extra layer because branch and draft providers need to
intercept document lookup. Previously they could answer `patchwork:repo` with a
custom proxy whose `find` behaved differently. The new API keeps that behavior
without tying providers to a specific branch implementation by exposing
`OverlayRepo`.

`OverlayRepo.find(url)` asks the provider tree for a `patchwork:dochandle`
descriptor. The root `<repo-provider>` responds with `{ url }`, which resolves
to the original document. A nearer provider can instead respond with
`{ url, cloneUrl }`, causing the overlay to read and write the clone while the
returned `OverlayHandle` still reports the presented `url`:

```ts
element.addEventListener("patchwork:subscribe", (event) => {
  if (event.detail.selector.type !== "patchwork:dochandle") return;

  const url = event.detail.selector.url as AutomergeUrl;
  accept<DocHandleDescriptor>(event, (respond) => {
    respond({ url, cloneUrl: getDraftCloneUrl(url) });
  });
});
```

Each `<patchwork-view>` creates an overlay repo for legacy tools so their
primary handle can be remapped by providers in the DOM ancestry. Component
tools receive the base repo directly, which lets providers create or clone
against the real repo without re-entering their own remapping.

## Other Changes

- Removed `provide`, `patchwork:request`, `patchwork:response`, and their event
  detail types in favor of `subscribe`, `accept`, `Selector`, and
  `SubscribeEvent`.
- Removed `<fallback-provider>`. Unclaimed selectors are no longer answered
  with `null`; a one-shot `request` for an unclaimed selector simply never
  resolves, while `subscribe` can be used when callers need to manage that case.
- Added `OverlayRepo`, `OverlayHandle`, `DocHandleDescriptor`, and
  `OverlayHandleOpts` exports from `@inkandswitch/patchwork-providers`.
- Updated `<repo-provider>` to act as the root fallback answerer for
  `patchwork:dochandle` and to carry the realm-local repo on `.repo`.
- Updated `<patchwork-view>` registration to require the realm-local `repo`,
  wrap legacy-mode document resolution with `OverlayRepo`, and pass the base
  repo as the second argument to component render functions.
- Updated the bootloader to install the root `<repo-provider>` above the app
  root and register `<patchwork-view>` with the realm-local repo.
- Replaced React `useDocRequest` with `useSubscribeDoc`, and added
  `useSubscribe` for streaming structured values.
- Replaced Solid `requestDoc` with `subscribeDoc`, added `subscribe`, and
  allowed Solid callers to pass an element thunk so refs can be resolved on
  mount.
