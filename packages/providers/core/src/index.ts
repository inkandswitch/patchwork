export interface RequestEventDetail {
  id: string;
  type: string;
  args?: Record<string, unknown>;
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
}

/**
 * Dispatch a `patchwork:request` and resolve with the provider's answer.
 *
 * `element` only needs to be *somewhere* inside a provider subtree — the
 * request resolves its context by walking up to the nearest
 * `<patchwork-view>` and dispatches (and listens for the response) from
 * there. When there is no enclosing view, it dispatches from `element`
 * itself; the event still bubbles and settles at the
 * `<fallback-provider>` if unanswered.
 *
 * Any target document url must be passed explicitly via `args.url`; this
 * helper no longer reads `doc-url` off the enclosing view.
 */
export function request<T = unknown>(
  element: HTMLElement,
  type: string,
  args?: Record<string, unknown>
): Promise<T | null> {
  const id = crypto.randomUUID();
  const view = element.closest<HTMLElement>("patchwork-view");
  const dispatchEl = view ?? element;

  return new Promise((resolve) => {
    const onResponse = (event: ResponseEvent) => {
      if (event.detail.id !== id) return;
      dispatchEl.removeEventListener("patchwork:response", onResponse);
      resolve(event.detail.value as T | null);
    };
    dispatchEl.addEventListener("patchwork:response", onResponse);

    const detail: RequestEventDetail = {
      id,
      type,
      ...(args ? { args } : {}),
    };

    dispatchEl.dispatchEvent(
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
export type { RepoLike } from "./types.js";
