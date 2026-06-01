import { createSignal, onCleanup, onMount, type Accessor } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { createDocumentProjection } from "@automerge/automerge-repo-solid-primitives";
import type { Doc, DocHandle } from "@automerge/automerge-repo";
import * as Providers from "@inkandswitch/patchwork-providers";
import type { Selector } from "@inkandswitch/patchwork-providers";

/**
 * Generic reactive request. Dispatches a `patchwork:request` of `type` on
 * mount and returns an accessor that updates when the provider responds.
 * `T` is the actual response type (e.g. `Repo`, plain data, a `DocHandle`).
 *
 * For request types that return a `DocHandle<T>` and a reactive doc
 * projection is wanted, prefer `requestDoc` instead.
 */
export function request<T>(
  element: HTMLElement,
  type: string,
  args?: Record<string, unknown>
): Accessor<T | undefined> {
  const [value, setValue] = createSignal<T | undefined>(undefined);
  onMount(() => {
    Providers.request<T>(element, type, args).then((v) => {
      if (v == null) return;
      // Wrap in a thunk so Solid does not treat values with call-like
      // methods (e.g. DocHandle, Repo) as setter functions.
      setValue(() => v);
    });
  });
  return value;
}

/**
 * Handle-specialized request. Use when the responding provider returns a
 * `DocHandle<T>`. Returns `[doc, handle]` matching the shape of
 * solid-primitives' `useDocument`. Both are accessors; they read `undefined`
 * until the provider responds. `T` is the doc shape inside the handle.
 */
export function requestDoc<T extends object>(
  element: HTMLElement,
  type: string,
  args?: Record<string, unknown>
): [Accessor<Doc<T> | undefined>, Accessor<DocHandle<T> | undefined>] {
  const handle = request<DocHandle<T>>(element, type, args);
  const doc = createDocumentProjection<T>(handle);
  return [doc, handle];
}

/**
 * Generic reactive subscription. Opens a `patchwork:subscribe` of `type` on
 * mount and returns an accessor that updates on every value the provider
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
  element: HTMLElement,
  selector: Selector,
  initialValue: T
): Accessor<T>;
export function subscribe<T>(
  element: HTMLElement,
  selector: Selector,
  initialValue?: T
): Accessor<T | undefined>;
export function subscribe<T>(
  element: HTMLElement,
  selector: Selector,
  initialValue?: T
): Accessor<T | undefined> {
  // The `{ value }` wrapper gives the store an object root, so `T` may be an
  // array or a primitive and not just an object.
  const [store, setStore] = createStore<{ value: T | undefined }>({
    value: initialValue,
  });
  onMount(() => {
    const unsubscribe = Providers.subscribe<T>(element, selector, (v) => {
      setStore(reconcile({ value: v }));
    });
    onCleanup(unsubscribe);
  });
  return () => store.value;
}
