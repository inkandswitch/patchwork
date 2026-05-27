import { createSignal, onMount, type Accessor } from "solid-js";
import { createDocumentProjection } from "@automerge/automerge-repo-solid-primitives";
import type { Doc, DocHandle } from "@automerge/automerge-repo";
import * as Providers from "@inkandswitch/patchwork-providers";

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
