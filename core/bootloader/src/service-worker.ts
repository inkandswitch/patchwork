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
  type ServiceWorkerDiagnostics,
} from "./types.js";
import { RingLogger } from "./logger.js";

let cachename = "default";
// Whether to PRINT service-worker logs to the console. Defaults on; the main
// thread can flip it via the "debug" message (see setup.ts). Gates console
// *display* only — the persistent ring logger below captures every log() call
// regardless, so the diagnostics bundle is complete either way.
let debugging = true;

// Persistent log capture for the diagnostics bundle, in its own
// `patchwork-logs-sw` database. The service worker doesn't touch the
// `automerge` store, so there's nothing to contend with — start immediately.
const swLog = new RingLogger("sw");
swLog.start();

// The unpatched console.log, captured before the patch below — used by log()
// to print its styled banner without re-recording through the patch.
const rawConsoleLog = console.log.bind(console);

for (const level of ["log", "info", "warn", "error", "debug"] as const) {
  const original = console[level].bind(console);
  console[level] = (...args: any[]) => {
    original(...args);
    swLog.record(level, args);
  };
}

self.addEventListener("error", (event) => {
  const e = event as ErrorEvent;
  swLog.record("error", [
    `uncaught error: ${e.message}`,
    e.error instanceof Error ? e.error.stack : undefined,
  ]);
});

self.addEventListener("unhandledrejection", (event) => {
  const reason = (event as PromiseRejectionEvent).reason;
  swLog.record("error", [
    "unhandled rejection:",
    reason instanceof Error ? reason.stack || reason.message : reason,
  ]);
});

const cacheableStatuses = [200, 203, 204];

// The automerge worker times its own resolution out after 30s and replies
// with an error, so this only fires when nobody is listening at all.
const HANDOFF_TIMEOUT_MS = 35_000;

function log(...args: any[]) {
  // Always capture clean (un-styled) args to the persistent ring, so the
  // diagnostics bundle has the full history regardless of `debugging`.
  swLog.record("debug", args);
  if (!debugging) return;
  // Display only: styled print via the raw (unpatched) console so we don't
  // re-record through the patch.
  rawConsoleLog(
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
  (event as ExtendableEvent).waitUntil(
    (async () => {
      await clearOldCaches();
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
                await cache.put(client.url, response);
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
    console.info(
      `deleting ${cachename} and setting cache name to ${nextCachename}`
    );
    caches.delete(cachename);
    cachename = nextCachename;
  } else if (event.data.type == "debug") {
    debugging = event.data.debug;
    log("serviceworker debugging enabled");
  } else if (event.data.type == "diagnostics") {
    const replyPort = event.ports[0];
    const data = await collectServiceWorkerDiagnostics();
    try {
      replyPort?.postMessage({ type: "diagnostics-result", data });
    } catch (error) {
      console.error("failed to post service worker diagnostics", error);
    }
    try {
      replyPort?.close();
    } catch {}
  }
});

/** Gather cache + log state for a diagnostics bundle. */
async function collectServiceWorkerDiagnostics(): Promise<ServiceWorkerDiagnostics> {
  const errors: string[] = [];
  const cacheInfos: ServiceWorkerDiagnostics["caches"] = [];
  try {
    for (const name of await caches.keys()) {
      try {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        cacheInfos.push({
          name,
          entryCount: requests.length,
          urls: requests.slice(0, 200).map((r) => r.url),
        });
      } catch (error) {
        errors.push(`cache ${name}: ${String(error)}`);
      }
    }
  } catch (error) {
    errors.push(`caches.keys: ${String(error)}`);
  }

  let logs: ServiceWorkerDiagnostics["logs"] = [];
  let logsDropped = 0;
  try {
    const result = await swLog.readForExport();
    logs = result.entries;
    logsDropped = result.dropped;
  } catch (error) {
    errors.push(`logs: ${String(error)}`);
  }

  return {
    collectedAt: Date.now(),
    cacheVersion: cachename,
    caches: cacheInfos,
    logs,
    logsDropped,
    errors,
  };
}

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
            return withSpecialHeaders(match);
          }

          log(`handing ${handoffURL} off to the automerge worker`);
          const replyPromise = handoff(request, handoffURL);
          fetchEvent.waitUntil(replyPromise.catch(() => {}));
          const reply = await replyPromise;

          if (reply.type === "response") {
            // errors, redirects and other things that shouldn't be cached
            log(`serving handed-off response for ${handoffURL}`, reply);
            return withSpecialHeaders(reply.response);
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
          return withSpecialHeaders(cached);
        } else {
          const response = await fetch(request).catch(() => null);
          if (response) {
            if (
              cacheableStatuses.includes(response.status) &&
              response.url.match(/^https?\:/)
            ) {
              await cache.put(request, response.clone()).catch((error) => {
                log(`error caching ${request.url} in ${cachename}`, error);
              });
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
