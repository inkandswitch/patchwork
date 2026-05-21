import { createSignal, onMount, type Accessor } from "solid-js";
import { createDocumentProjection } from "@automerge/automerge-repo-solid-primitives";
import type { Doc, DocHandle } from "@automerge/automerge-repo";
import { request as requestHandle } from "@inkandswitch/patchwork-providers";

/**
 * Request a handle from a provider once on mount and project it into a
 * fine-grained reactive doc. Returns `[doc, handle]`, matching the shape of
 * solid-primitives' `useDocument`. Both elements are accessors; they read
 * `undefined` until the provider responds.
 */
export function request<T extends object>(
  element: HTMLElement,
  type: string,
  args?: Record<string, unknown>
): [Accessor<Doc<T> | undefined>, Accessor<DocHandle<T> | undefined>] {
  const [handle, setHandle] = createSignal<DocHandle<T> | undefined>(undefined);
  onMount(() => {
    requestHandle<T>(element, type, args).then((h) => {
      if (!h) return;
      // Wrap in a thunk so Solid does not treat the DocHandle (which has
      // call-like methods) as a setter function.
      setHandle(() => h);
    });
  });
  const doc = createDocumentProjection<T>(handle);
  return [doc, handle];
}
