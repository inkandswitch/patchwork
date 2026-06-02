import { createSignal, onCleanup, onMount, type Accessor } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { createDocumentProjection } from "@automerge/automerge-repo-solid-primitives";
import type { AutomergeUrl, Doc, DocHandle } from "@automerge/automerge-repo";
import * as Providers from "@inkandswitch/patchwork-providers";
import type { Selector } from "@inkandswitch/patchwork-providers";

/**
 * The dispatch target for a subscription: either an element or — more commonly
 * — a thunk returning one. Passing `() => ref` lets the element be read lazily
 * on mount, after Solid has assigned the `ref`, so callers can subscribe from
 * their own (not-yet-rendered) element.
 */
type ElementSource = HTMLElement | (() => HTMLElement | undefined);

const resolveElement = (source: ElementSource): HTMLElement | undefined =>
  typeof source === "function" ? source() : source;

/**
 * Generic reactive request. Resolves the first value a provider emits for
 * `selector` (via the one-shot `request` helper) and returns an accessor that
 * reads `undefined` until then. `T` is the response type.
 */
export function request<T>(
  element: ElementSource,
  selector: Selector
): Accessor<T | undefined> {
  const [value, setValue] = createSignal<T | undefined>(undefined);
  onMount(() => {
    const el = resolveElement(element);
    if (!el) return;
    Providers.request<T>(el, selector).then((v) => {
      if (v == null) return;
      // Wrap in a thunk so Solid does not treat values with call-like
      // methods (e.g. DocHandle, Repo) as setter functions.
      setValue(() => v);
    });
  });
  return value;
}

/**
 * Generic reactive subscription. Opens a `patchwork:subscribe` for `selector`
 * on mount and returns an accessor that updates on every value the provider
 * pushes. The subscription is torn down on cleanup.
 *
 * Values arrive structured-cloned over the channel, so `T` is always plain
 * data. Backing the accessor with a store + `reconcile` means nested updates
 * are diffed and only the parts that changed trigger downstream recomputation.
 *
 * Pass `initialValue` to seed the accessor so it reads that value (rather than
 * `undefined`) until the first emission. If no provider answers, the accessor
 * simply stays at the initial value.
 */
export function subscribe<T>(
  element: ElementSource,
  selector: Selector,
  initialValue: T
): Accessor<T>;
export function subscribe<T>(
  element: ElementSource,
  selector: Selector,
  initialValue?: T
): Accessor<T | undefined>;
export function subscribe<T>(
  element: ElementSource,
  selector: Selector,
  initialValue?: T
): Accessor<T | undefined> {
  // The `{ value }` wrapper gives the store an object root, so `T` may be an
  // array or a primitive and not just an object.
  const [store, setStore] = createStore<{ value: T | undefined }>({
    value: initialValue,
  });
  onMount(() => {
    const el = resolveElement(element);
    if (!el) return;
    const unsubscribe = Providers.subscribe<T>(el, selector, (v) => {
      setStore(reconcile({ value: v }));
    });
    onCleanup(unsubscribe);
  });
  return () => store.value;
}

/**
 * Handle-specialized subscription. Use when the answering provider emits an
 * `AutomergeUrl`. The handle is recovered locally from the global repo
 * (`window.repo`), so it stays fully live — reads project reactively and writes go
 * straight back to the same repo. Returns `[doc, handle]` matching the shape
 * of solid-primitives' `useDocument`; both read `undefined` until the first
 * url arrives. `T` is the doc shape inside the handle.
 */
export function subscribeDoc<T extends object>(
  element: ElementSource,
  selector: Selector
): [Accessor<Doc<T> | undefined>, Accessor<DocHandle<T> | undefined>] {
  const [handle, setHandle] = createSignal<DocHandle<T> | undefined>(undefined);
  onMount(() => {
    const el = resolveElement(element);
    if (!el) return;
    let canceled = false;
    const unsubscribe = Providers.subscribe<AutomergeUrl>(
      el,
      selector,
      (url) => {
        if (!url) return;
        const repo = "repo" in window ? window.repo : undefined;
        if (!repo) return;
        void Promise.resolve(repo.find<T>(url)).then((h) => {
          if (canceled) return;
          setHandle(() => h);
        });
      }
    );
    onCleanup(() => {
      canceled = true;
      unsubscribe();
    });
  });
  const doc = createDocumentProjection<T>(handle);
  return [doc, handle];
}
