import { createSignal, onCleanup, onMount, type Accessor } from "solid-js";
import { createStore, reconcile, type Store } from "solid-js/store";
import { createDocumentProjection } from "@automerge/automerge-repo-solid-primitives";
import type { AutomergeUrl, Doc, DocHandle } from "@automerge/automerge-repo";
import * as Providers from "@inkandswitch/patchwork-providers";
import type {
  JSONArray,
  JSONObject,
  JSONValue,
  Selector,
} from "@inkandswitch/patchwork-providers";

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
export function request<T extends JSONValue>(
  element: ElementSource,
  selector: Selector
): Accessor<T | undefined> {
  const [value, setValue] = createSignal<T | undefined>(undefined);
  onMount(() => {
    const el = resolveElement(element);
    if (!el) return;
    Providers.request<T>(el, selector).then((v) => {
      if (v == null) return;
      setValue(() => v);
    });
  });
  return value;
}

/**
 * Generic reactive subscription. Opens a `patchwork:subscribe` for `selector`
 * on mount and returns an accessor that updates as the provider pushes new
 * values. The subscription is torn down on cleanup.
 *
 * Pass `initialValue` to seed the accessor so it reads that value (rather than
 * `undefined`) until the first emission. If no provider answers, the accessor
 * simply stays at the initial value.
 */
export function subscribe<T extends JSONValue>(
  element: ElementSource,
  selector: Selector,
  initialValue: T
): Accessor<T>;
export function subscribe<T extends JSONValue>(
  element: ElementSource,
  selector: Selector,
  initialValue?: T
): Accessor<T | undefined>;
export function subscribe<T extends JSONValue>(
  element: ElementSource,
  selector: Selector,
  initialValue?: T
): Accessor<T | undefined> {
  const [value, setValue] = createSignal<T | undefined>(initialValue);
  onMount(() => {
    const el = resolveElement(element);
    if (!el) return;
    const unsubscribe = Providers.subscribe<T>(el, selector, setValue);
    onCleanup(unsubscribe);
  });
  return value;
}

/**
 * Store-backed subscription. Use this when a consumer wants Solid's
 * fine-grained nested reactivity for incoming JSON object or array snapshots.
 * Requires an initial object/array so the store has a stable root.
 *
 * `reconcile` preserves stable object/array identity where possible, so this
 * helper is not a good fit when the top-level value is used as an identity key
 * for resources or memos.
 */
export function subscribeReconciled<T extends JSONArray | JSONObject>(
  element: ElementSource,
  selector: Selector,
  initialValue: T
): Store<T> {
  const [store, setStore] = createStore<T>(initialValue);
  onMount(() => {
    const el = resolveElement(element);
    if (!el) return;
    const unsubscribe = Providers.subscribe<T>(el, selector, (v) => {
      setStore(reconcile(v));
    });
    onCleanup(unsubscribe);
  });
  return store;
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
