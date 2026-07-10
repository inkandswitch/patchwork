/// <reference types="service-worker-types" />

// The service worker holds no automerge repo — that lives in the automerge
// SharedWorker (automerge-worker.ts). This worker manages the cache. When a
// special URL misses the cache it broadcasts a handoff request; the
// automerge worker resolves it, puts the response in our cache, and replies
// "cached" (or "response" for errors and other things that shouldn't be
// cached).

import {
  HANDOFF_CHANNEL,
  type HandoffReplyMessage,
  type HandoffRequestMessage,
} from "./types.js";

const DEFAULT_CACHE_NAME = "patchwork";

let cachename = DEFAULT_CACHE_NAME;
let debugging = false;

// 0 is an opaque response, that also needs cached
const cacheableStatuses = [0, 200, 203, 204];

// The automerge worker times its own resolution out after 30s and replies
// with an error, so this only fires when nobody is listening at all.
const HANDOFF_TIMEOUT_MS = 35_000;

function log(...args: any[]) {
  if (!debugging) return;
  console.log.call(
    console,
    `%cpatchwork:serviceworker%c\n`,
    `color: #00ffcc; font-weight: bold`,
    "color: inherit",
    ...args
  );
}

// ── Lifecycle diagnostics ──────────────────────────────────────────────
// [lifecycle] markers for SW (re)boots, install/activate, crashes, and stranded
// handoffs. The SW can't read localStorage, so it always emits and forwards to
// the tab, which gates rendering on the live toggle. The SW holds no sync
// socket — observability only.

async function postToClients(message: unknown) {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of clients) client.postMessage(message);
}

function lifecycle(level: "info" | "warn", text: string) {
  const msg = `[lifecycle] ${new Date().toISOString()} ${text}`;
  console[level](msg);
  void postToClients({ type: "sw-lifecycle", level, msg });
}

lifecycle("info", `booted (scope ${self.registration?.scope ?? "?"})`);

self.addEventListener("error", (event) => {
  const e = event as ErrorEvent;
  lifecycle(
    "warn",
    `uncaught error: ${e.message}` +
      (e.filename ? ` @ ${e.filename}:${e.lineno}:${e.colno}` : "")
  );
});

self.addEventListener("unhandledrejection", (event) => {
  const reason = (event as PromiseRejectionEvent).reason;
  lifecycle(
    "warn",
    `unhandled rejection: ${
      reason instanceof Error ? reason.stack || reason.message : String(reason)
    }`
  );
});

self.addEventListener("install", (event) => {
  lifecycle("info", "install (skipWaiting)");
  // waitUntil keeps the worker alive until skipWaiting resolves, so a freshly
  // installed SW reliably jumps the "waiting" queue instead of stalling until
  // every old tab closes.
  (event as ExtendableEvent).waitUntil(self.skipWaiting());
});

async function clearOtherCaches() {
  await Promise.all(
    (await caches.keys()).map((cacheName) => {
      if (cacheName !== cachename) return caches.delete(cacheName);
    })
  );
}

self.addEventListener("activate", (event) => {
  lifecycle("info", "activate (claiming clients)");
  (event as ExtendableEvent).waitUntil(
    (async () => {
      await clearOtherCaches();
      await self.clients.claim();
      // Pre-cache pages of already-open clients so they survive going offline
      // before the next navigation.
      const allClients = await self.clients.matchAll({ type: "window" });
      const cache = await caches.open(cachename);
      await Promise.all(
        allClients.map(async (client) => {
          try {
            const existing = await cache.match(client.url);
            if (!existing) {
              const response = await fetch(client.url);
              if (cacheableStatuses.includes(response.status)) {
                await cachePage(cache, client.url, response);
              }
            }
          } catch {
            // Network may be unavailable during activation
          }
        })
      );
    })()
  );
});

self.addEventListener("message", async (event) => {
  if (event.data.type == "cachename") {
    const nextCachename = event.data.cachename;
    if (cachename == nextCachename) {
      return;
    }
    console.info(`moving from cache ${cachename} to ${nextCachename}`);
    if (cachename === DEFAULT_CACHE_NAME) {
      const defaultCache = await caches.open(cachename);
      const nextCache = await caches.open(nextCachename);
      await Promise.all(
        (await defaultCache.keys()).map(async (request) => {
          const response = await defaultCache.match(request);
          if (response) await nextCache.put(request, response);
        })
      );
    }
    cachename = nextCachename;
    await clearOtherCaches();
  } else if (event.data.type == "debug") {
    debugging = event.data.debug;
    log("serviceworker debugging enabled");
  }
});

// ── Handoff to the automerge worker ────────────────────────────────────

const handoffChannel = new BroadcastChannel(HANDOFF_CHANNEL);

type PendingHandoff = {
  message: HandoffRequestMessage;
  resolvers: PromiseWithResolvers<HandoffReplyMessage>;
};

const pendingHandoffs = new Map<string, PendingHandoff>();

handoffChannel.addEventListener("message", (event) => {
  const data = event.data;
  if (data?.type === "cached" || data?.type === "response") {
    const pending = pendingHandoffs.get(data.id);
    if (!pending) {
      return log(`no pending handoff for id ${data.id}`);
    }
    pending.resolvers.resolve(data as HandoffReplyMessage);
  } else if (data?.type === "online") {
    // The automerge worker (re)started — re-broadcast anything still in
    // flight so requests that raced its boot aren't stranded.
    const stranded = [...pendingHandoffs.values()];
    if (stranded.length > 0) {
      lifecycle(
        "info",
        `automerge worker (re)started; re-broadcasting ${stranded.length} ` +
          `in-flight asset handoff(s)`
      );
    }
    for (const { message } of stranded) {
      log(`re-broadcasting handoff ${message.id} to the fresh worker`);
      handoffChannel.postMessage(message);
    }
  }
});

function handoff(
  request: Request,
  handoffURL: URL
): Promise<HandoffReplyMessage> {
  const id = crypto.randomUUID();
  const resolvers = Promise.withResolvers<HandoffReplyMessage>();
  const message: HandoffRequestMessage = {
    id,
    type: "request",
    cachename,
    request: {
      url: request.url,
      handoffURL: handoffURL.href,
      headers: Object.fromEntries(request.headers.entries()),
      method: request.method,
      destination: request.destination,
      referrer: request.referrer,
    },
  };
  pendingHandoffs.set(id, { message, resolvers });
  log(`broadcasting handoff request for cache ${cachename}`, message);
  handoffChannel.postMessage(message);
  const timeout = setTimeout(() => {
    lifecycle(
      "warn",
      `asset handoff ${id} stranded: no reply from the automerge worker after ` +
        `${HANDOFF_TIMEOUT_MS}ms (${handoffURL.href})`
    );
    resolvers.reject(
      new Error(
        `no reply from the automerge worker after ${HANDOFF_TIMEOUT_MS}ms`
      )
    );
  }, HANDOFF_TIMEOUT_MS);
  return resolvers.promise.finally(() => {
    clearTimeout(timeout);
    pendingHandoffs.delete(id);
  });
}

function makeResponse(response: {
  body?: BodyInit | ReadableStream<Uint8Array> | null;
  status?: number;
  headers?: HeadersInit;
}): Response {
  return new Response(response.body ?? null, {
    status: response.status ?? 200,
    headers: response.headers,
  });
}

function indexRequestFor(request: Request | string): Request | undefined {
  const url = new URL(typeof request === "string" ? request : request.url);
  if (url.origin !== self.location.origin) return undefined;
  url.pathname = "/index.html";
  url.search = "";
  url.hash = "";
  return new Request(url.href);
}

function rootRequestFor(request: Request | string): Request | undefined {
  const url = new URL(typeof request === "string" ? request : request.url);
  if (url.origin !== self.location.origin) return undefined;
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return new Request(url.href);
}

async function cachePage(
  cache: Cache,
  request: Request | string,
  response: Response
) {
  const indexRequest = indexRequestFor(request);
  if (indexRequest) await cache.put(indexRequest, response.clone());
  const rootRequest = rootRequestFor(request);
  if (rootRequest) await cache.put(rootRequest, response.clone());
  await cache.put(request, response);
}

// ── Fetch handler ──────────────────────────────────────────────────────

self.addEventListener("fetch", (fetchEvent: FetchEvent) => {
  log("fetch event", fetchEvent.request.url);
  const request = fetchEvent.request;
  if (request.method !== "GET") return fetchEvent.respondWith(fetch(request));
  const url = new URL(fetchEvent.request.url);

  let handoffURL: URL | undefined;

  if (
    url.hostname == self.location.hostname &&
    url.port == self.location.port &&
    url.protocol == self.location.protocol
  ) {
    try {
      handoffURL = new URL(decodeURIComponent(url.pathname.slice(1)));
      log(`received special request ${handoffURL}`);
    } catch {}
  }

  fetchEvent.respondWith(
    (async () => {
      const cache = await caches.open(cachename);
      const match = await cache.match(request);

      try {
        if (handoffURL) {
          if (match) {
            log(`serving ${handoffURL} from cache ${cachename}`);
            return match;
          }

          log(`handing ${handoffURL} off to the automerge worker`);
          const replyPromise = handoff(request, handoffURL);
          fetchEvent.waitUntil(replyPromise.catch(() => {}));
          const reply = await replyPromise;

          if (reply.type === "response") {
            // errors, redirects and other things that shouldn't be cached
            log(`serving handed-off response for ${handoffURL}`, reply);
            return makeResponse(reply.response);
          }

          // reply.type === "cached": the automerge worker has put the
          // response in our cache
          const cached = await cache.match(request);
          if (!cached) {
            return new Response(
              `the automerge worker reported ${handoffURL} cached, but it has no match in ${cachename}`,
              { status: 555 }
            );
          }
          log(`serving ${handoffURL} from cache ${cachename} after handoff`);
          return cached;
        } else {
          // fetch() rejects on network error / abort rather than resolving;
          // keep the error so we can surface it in the 503 body below.
          const result = await fetch(request).catch((error: unknown) =>
            error instanceof Error ? error : new Error(String(error))
          );
          if (result instanceof Response) {
            const response = result;
            // Tool subresources (<link>/<script>) are requested from srcdoc
            // frames whose origin is "null", so they come back as opaque
            // cross-origin `no-cors` responses: status 0 and an empty url. They
            // render fine while online but were being excluded from the cache,
            // so e.g. a theme stylesheet vanished on an offline refresh. Opaque
            // responses are cacheable and replay to the same no-cors consumer,
            // so treat status 0 as cacheable and gate the scheme on request.url
            // (an opaque response's own url is "").
            if (
              (response.status === 0 ||
                cacheableStatuses.includes(response.status)) &&
              /^https?:/.test(request.url)
            ) {
              const cachedResponse = response.clone();
              await (
                request.mode === "navigate" ||
                request.destination === "document"
                  ? cachePage(cache, request, cachedResponse)
                  : cache.put(request, cachedResponse)
              ).catch((error) => {
                log(`error caching ${request.url} in ${cachename}`, error);
              });
            } else {
              log(
                `skipping uncacheable response code from cache: ${response.status} for ${request.url}`
              );
            }
            return response;
          }
          if (match) return match;
          return new Response(
            `couldnt fetch ${request.url} and no stale copy in ${cachename}\n\n${
              result.stack ?? result.message
            }`,
            { status: 503, headers: { "content-type": "text/plain" } }
          );
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? `${error.message}\n\n${error.stack}`
            : String(error);
        console.error(
          `service worker error resolving ${request.url}${handoffURL ? ` (for: ${handoffURL})` : ""}`,
          error
        );
        if (match) return match;

        return new Response(message, {
          status: 556,
          headers: { "content-type": "text/plain" },
        });
      }
    })()
  );
});
