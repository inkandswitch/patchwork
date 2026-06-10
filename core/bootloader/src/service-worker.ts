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

let cachename = "default";
let debugging = false;

const cacheableStatuses = [200, 203, 204, 206];

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

self.addEventListener("install", (event) => {
  // waitUntil keeps the worker alive until skipWaiting resolves, so a freshly
  // installed SW reliably jumps the "waiting" queue instead of stalling until
  // every old tab closes.
  (event as ExtendableEvent).waitUntil(self.skipWaiting());
});

async function clearOldCaches() {
  const cacheWhitelist = [cachename];
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames.map((cacheName) => {
    if (!cacheWhitelist.includes(cacheName)) {
      return caches.delete(cacheName);
    }
  });
  await Promise.all(deletePromises);
}

self.addEventListener("activate", (event) => {
  // Without waitUntil the activate event settles immediately and clients.claim()
  // runs detached — the new worker can be killed before it takes control, so
  // existing tabs keep talking to the old SW. Extend the event instead.
  (event as ExtendableEvent).waitUntil(
    (async () => {
      await clearOldCaches();
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", async (event) => {
  if (event.data.type == "cachename") {
    const nextCachename = event.data.cachename;
    if (cachename == nextCachename) {
      return;
    }
    console.info(
      `deleting ${cachename} and setting cache name to ${nextCachename}`
    );
    caches.delete(cachename);
    cachename = nextCachename;
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
    for (const { message } of pendingHandoffs.values()) {
      log(`re-broadcasting handoff ${message.id} to the fresh worker`);
      handoffChannel.postMessage(message);
    }
  }
});

function handoff(request: Request): Promise<HandoffReplyMessage> {
  const id = crypto.randomUUID();
  const resolvers = Promise.withResolvers<HandoffReplyMessage>();
  const message: HandoffRequestMessage = {
    id,
    type: "request",
    cachename,
    request: {
      url: request.url,
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

function withSpecialHeaders(response: {
  body?: BodyInit | ReadableStream<Uint8Array> | null;
  status?: number;
  headers?: HeadersInit;
}): Response {
  const headers = new Headers(response.headers);
  headers.set("cross-origin-embedder-policy", "credentialless");
  headers.set("cross-origin-resource-policy", "cross-origin");
  return new Response(response.body ?? null, {
    status: response.status ?? 200,
    headers,
  });
}

// ── Fetch handler ──────────────────────────────────────────────────────

self.addEventListener("fetch", (fetchEvent: FetchEvent) => {
  log("fetch event", fetchEvent.request.url);
  const request = fetchEvent.request;
  if (request.method !== "GET") return fetchEvent.respondWith(fetch(request));
  const url = new URL(fetchEvent.request.url);

  let specialURL: URL | undefined;

  if (
    url.hostname == self.location.hostname &&
    url.port == self.location.port &&
    url.protocol == self.location.protocol
  ) {
    try {
      specialURL = new URL(decodeURIComponent(url.pathname.slice(1)));
      log(`received special request ${specialURL}`);
    } catch {}
  }

  fetchEvent.respondWith(
    (async () => {
      const cache = await caches.open(cachename);
      const match = await cache.match(request);

      try {
        if (specialURL) {
          if (match) {
            log(`serving ${specialURL} from cache ${cachename}`);
            return withSpecialHeaders(match);
          }

          log(`handing ${specialURL} off to the automerge worker`);
          const replyPromise = handoff(request);
          fetchEvent.waitUntil(replyPromise.catch(() => {}));
          const reply = await replyPromise;

          if (reply.type === "response") {
            // errors, redirects and other things that shouldn't be cached
            log(`serving handed-off response for ${specialURL}`, reply);
            return withSpecialHeaders(reply.response);
          }

          // reply.type === "cached": the automerge worker has put the
          // response in our cache
          const cached = await cache.match(request);
          if (!cached) {
            return new Response(
              `the automerge worker reported ${specialURL} cached, but it has no match in ${cachename}`,
              { status: 500 }
            );
          }
          log(`serving ${specialURL} from cache ${cachename} after handoff`);
          return withSpecialHeaders(cached);
        } else {
          const response = await fetch(request).catch(() => null);
          if (response) {
            if (
              cacheableStatuses.includes(response.status) &&
              response.url.match(/^https?\:/)
            ) {
              await cache.put(request, response.clone());
            } else {
              log(
                `skipping uncacheable response code from cache: ${response.status} for ${response.url}`
              );
            }
            return response;
          }
          if (match) return match;
          return new Response("couldnt fetch and no stale", { status: 503 });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? `${error.message}\n\n${error.stack}`
            : String(error);
        console.error(
          `service worker error resolving ${request.url}${specialURL ? ` (for: ${specialURL})` : ""}`,
          error
        );
        if (match) return match;

        return new Response(message, {
          status: 500,
          headers: { "content-type": "text/plain" },
        });
      }
    })()
  );
});
