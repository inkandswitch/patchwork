import { useEffect, useState } from "react";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import type { Doc, DocHandle } from "@automerge/automerge-repo";
import * as Providers from "@inkandswitch/patchwork-providers";

/**
 * Generic reactive request hook. Dispatches a `patchwork:request` of `type`
 * on mount (and whenever `element`/`type` change) and returns the response
 * once the provider answers. `T` is the actual response type (e.g. `Repo`,
 * plain data, a `DocHandle`).
 *
 * For request types that return a `DocHandle<T>` and a live doc is wanted,
 * prefer `useDocRequest` instead.
 */
export function useRequest<T>(
  element: HTMLElement,
  type: string,
  args?: Record<string, unknown>
): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    let canceled = false;
    Providers.request<T>(element, type, args).then((v) => {
      if (canceled || v == null) return;
      setValue(() => v);
    });
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element, type]);

  return value;
}

/**
 * Handle-specialized request hook. Use when the responding provider returns
 * a `DocHandle<T>`. Returns `[doc, handle]` matching the shape of
 * `useDocument` from `@automerge/automerge-repo-react-hooks`. `T` is the doc
 * shape inside the handle.
 */
export function useDocRequest<T>(
  element: HTMLElement,
  type: string,
  args?: Record<string, unknown>
): [Doc<T> | undefined, DocHandle<T> | undefined] {
  const handle = useRequest<DocHandle<T>>(element, type, args);
  const [doc] = useDocument<T>(handle?.url);
  return [doc, handle];
}
