import { isValidAutomergeUrl, type AutomergeUrl } from "@automerge/automerge-repo";

export interface RequestEventDetail {
  id: string;
  type: string;
  args?: Record<string, unknown>;
  url?: AutomergeUrl;
}

export interface ResponseEventDetail<T = unknown> {
  id: string;
  value: T | null;
}

export type RequestEvent = CustomEvent<RequestEventDetail>;
export type ResponseEvent<T = unknown> = CustomEvent<ResponseEventDetail<T>>;

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
): Promise<T | null> {
  const id = crypto.randomUUID();

  return new Promise((resolve) => {
    const onResponse = (event: ResponseEvent) => {
      if (event.detail.id !== id) return;
      element.removeEventListener("patchwork:response", onResponse);
      resolve(event.detail.value as T | null);
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

/**
 * Respond to a `patchwork:request`. Accepts either a value or a promise;
 * rejections are logged and treated as `null`. Stops propagation so
 * ancestor providers don't double-answer.
 */
export function provide<T>(
  event: RequestEvent,
  value: T | null | Promise<T | null>
): void {
  event.stopPropagation();
  const target = event.target as HTMLElement;
  const id = event.detail.id;
  const respond = (resolved: T | null) => {
    target.dispatchEvent(
      new CustomEvent<ResponseEventDetail<T>>("patchwork:response", {
        detail: { id, value: resolved },
      })
    );
  };
  if (value instanceof Promise) {
    value.then(respond, (err) => {
      console.error("[patchwork-providers] async provide rejected:", err);
      respond(null);
    });
  } else {
    respond(value);
  }
}

export {
  registerRepoProviderElement,
  type RepoProviderElement,
} from "./repo-provider.js";
export {
  registerFallbackProviderElement,
  type FallbackProviderElement,
} from "./fallback-provider.js";
