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

type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

/**
 * What a subscription is keyed on. A plain JSON object that always carries a
 * `type` discriminant; any other fields are subscription-specific arguments
 * (e.g. `{ type: "patchwork:comments", url }`). Being JSON means it survives
 * the structured clone across the `patchwork:subscribe` event boundary.
 */
export type Selector = { type: string } & { [key: string]: JSONValue };

export type SubscribeEventDetail = {
  selector: Selector;
  port: MessagePort;
};

export type SubscribeEvent = CustomEvent<SubscribeEventDetail>;

type Listener<T> = (value: T) => void;
type Unsubscribe = () => void;
type Producer<T> = (respond: Listener<T>) => Unsubscribe | void;

type ChangeMessage<T> = { type: "change"; value: T };
type UnsubscribeMessage = { type: "unsubscribe" };

declare global {
  interface ElementEventMap {
    "patchwork:request": RequestEvent;
    "patchwork:response": ResponseEvent;
    "patchwork:subscribe": SubscribeEvent;
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

/**
 * Open a streaming subscription. Dispatches a `patchwork:subscribe` for the
 * given `selector` carrying a fresh `MessageChannel` port; the answering
 * provider pushes values back over that channel for as long as the
 * subscription is live. `listener` is invoked once per emission (the first
 * delivery is always async because `MessagePort.postMessage` queues a task).
 *
 * Like `request`, the event is dispatched from the nearest enclosing
 * `<patchwork-view>` so callers can pass any node inside a provider subtree.
 * Unlike `request`, an unclaimed subscription is never settled: if no provider
 * answers, `listener` simply never fires.
 *
 * Returns an unsubscribe function. Calling it tells the provider to tear down
 * (via an `unsubscribe` message) and closes the consumer's port; any values
 * the provider emits after that are dropped.
 */
export function subscribe<T = unknown>(
  element: HTMLElement,
  selector: Selector,
  listener: Listener<T>
): Unsubscribe {
  const view = element.closest<HTMLElement>("patchwork-view");
  const dispatchEl = view ?? element;

  const channel = new MessageChannel();
  const port = channel.port2;

  const controller = new AbortController();
  const { signal } = controller;
  port.addEventListener(
    "message",
    (event: MessageEvent<ChangeMessage<T>>) => {
      if (event.data?.type === "change") listener(event.data.value);
    },
    { signal }
  );
  // addEventListener (unlike assigning onmessage) does not implicitly start
  // the port, so message delivery has to be kicked off explicitly.
  port.start();

  const detail: SubscribeEventDetail = {
    selector,
    port: channel.port1,
  };

  dispatchEl.dispatchEvent(
    new CustomEvent<SubscribeEventDetail>("patchwork:subscribe", {
      detail,
      bubbles: true,
      composed: true,
    })
  );

  return () => {
    if (signal.aborted) return;
    controller.abort();
    try {
      port.postMessage({ type: "unsubscribe" });
    } catch {
      // Port already closed; nothing to tell the provider.
    }
    port.close();
  };
}

/**
 * Answer a `patchwork:subscribe`. The `producer` receives a `respond`
 * callback it can call any number of times to push values to the consumer,
 * and may return a teardown that runs when the consumer unsubscribes. Stops
 * propagation so ancestor providers don't double-answer. Values emitted after
 * the consumer unsubscribes are dropped.
 */
export function accept<T>(event: SubscribeEvent, producer: Producer<T>): void {
  event.stopPropagation();
  const port = event.detail.port;

  let alive = true;
  const respond: Listener<T> = (value) => {
    if (!alive) return;
    port.postMessage({ type: "change", value });
  };

  let teardown: Unsubscribe | void;
  try {
    teardown = producer(respond);
  } catch (err) {
    console.error("[patchwork-providers] subscribe producer threw:", err);
  }

  const stop = () => {
    if (!alive) return;
    alive = false;
    try {
      teardown?.();
    } catch (err) {
      console.error("[patchwork-providers] subscribe teardown threw:", err);
    }
    port.close();
  };

  port.onmessage = (event: MessageEvent<UnsubscribeMessage>) => {
    if (event.data?.type === "unsubscribe") stop();
  };
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
