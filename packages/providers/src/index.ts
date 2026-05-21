import {
  isValidAutomergeUrl,
  type AutomergeUrl,
  type DocHandle,
} from "@automerge/automerge-repo";

export interface RequestEventDetail {
  id: string;
  type: string;
  args?: Record<string, unknown>;
  url?: AutomergeUrl;
}

export interface ResponseEventDetail {
  id: string;
  handle: DocHandle<unknown> | null;
}

export type RequestEvent = CustomEvent<RequestEventDetail>;
export type ResponseEvent = CustomEvent<ResponseEventDetail>;

declare global {
  interface ElementEventMap {
    "patchwork:request": RequestEvent;
    "patchwork:response": ResponseEvent;
  }
  interface ShadowRootEventMap {
    "patchwork:request": RequestEvent;
    "patchwork:response": ResponseEvent;
  }
}

export function request<T = unknown>(
  element: HTMLElement,
  type: string,
  args?: Record<string, unknown>
): Promise<DocHandle<T> | null> {
  const id = crypto.randomUUID();

  return new Promise((resolve) => {
    const onResponse = (event: ResponseEvent) => {
      if (event.detail.id !== id) return;
      element.removeEventListener("patchwork:response", onResponse);
      resolve(event.detail.handle as DocHandle<T> | null);
    };
    element.addEventListener("patchwork:response", onResponse);

    const rawUrl = element.getAttribute("doc-url");
    const url = rawUrl && isValidAutomergeUrl(rawUrl) ? rawUrl : undefined;

    const detail: RequestEventDetail = {
      id,
      type,
      ...(args ? { args } : {}),
      ...(url ? { url } : {}),
    };

    element.dispatchEvent(
      new CustomEvent<RequestEventDetail>("patchwork:request", {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  });
}

export function provide(
  event: RequestEvent,
  handle: DocHandle<unknown> | null
): void {
  event.stopPropagation();
  const target = event.target as HTMLElement;
  target.dispatchEvent(
    new CustomEvent<ResponseEventDetail>("patchwork:response", {
      detail: { id: event.detail.id, handle },
    })
  );
}
