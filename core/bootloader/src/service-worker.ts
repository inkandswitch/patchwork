/// <reference types="service-worker-types" />

import { SwLogger } from "./sw-logger.js";

// Heavy imports — marked external by the service-worker vite plugin,
// resolved to /packages/... URLs at build time. The SW is registered with
// type:"module" so the browser fetches these as regular network requests.
// Uses /slim to avoid top-level await (disallowed in service workers).
// Wasm is fetched from /automerge.wasm (emitted by the vite plugin) instead
// of bundling the ~3MB base64 string.
import { initializeWasm } from "@automerge/automerge/slim";
// eslint-disable-next-line
// @ts-ignore — initSync is a wasm-bindgen runtime helper not in the .d.ts
import { initSync as initSubductionSync } from "@automerge/automerge-subduction/slim";
import { WebCryptoSigner } from "@automerge/automerge-subduction/slim";

import {
  Repo,
  isValidAutomergeUrl,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  type PeerId,
} from "@automerge/automerge-repo/slim";
import { resolvePath } from "@inkandswitch/patchwork-filesystem";

// Small adapters — bundled directly into the SW
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";

// TEMPORARY: enable debug npm module in SW context (no localStorage available)
let cachename = "default";
let debugging = false;

const SUBDUCTION_ENDPOINTS = ["wss://subduction.sync.inkandswitch.com"];
const RESOLVE_TIMEOUT_MS = 5_000;

// ── Persistent logger ───────────────────────────────────────────────────
// Initialized eagerly so it's available for the entire SW lifetime.
// Access from the SW inspector console via self.printLogs(), self.tailLogs(),
// self.exportLogs(), self.clearLogs().
const slog = SwLogger.open().then((logger) => {
  (self as any).slog = logger;

  (self as any).printLogs = async (n = 200) => {
    const entries = await logger.tail(n);
    for (const e of entries) {
      const prefix = `[${e.ts}] [${e.level}]`;
      if (e.data !== undefined) {
        console.log(prefix, e.msg, e.data);
      } else {
        console.log(prefix, e.msg);
      }
    }
    console.log(`--- ${entries.length} entries ---`);
  };

  (self as any).tailLogs = (n = 200) => logger.tail(n);
  (self as any).exportLogs = () => logger.exportAll();
  (self as any).clearLogs = () => logger.clear();

  logger.info("sw-logger initialized");
  return logger;
});

const cacheableStatuses = [
  200, 203, 204, 206, 300, 301, 404, 405, 410, 414, 501,
];

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

self.addEventListener("install", () => self.skipWaiting());

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

self.addEventListener("activate", async () => {
  await clearOldCaches();
  clients.claim();
});

let repoPromise: Promise<Repo> | null = null;

function getRepo() {
  if (!repoPromise) {
    repoPromise = (async () => {
      const logger = await slog;

      logger.info("fetching wasm modules");
      const [amWasmBuf, sdnWasmBuf] = await Promise.all([
        fetch("/automerge.wasm?sw").then((r) => r.arrayBuffer()),
        fetch("/subduction.wasm").then((r) => r.arrayBuffer()),
      ]);
      initSubductionSync(new Uint8Array(sdnWasmBuf));
      await initializeWasm(new Uint8Array(amWasmBuf));
      logger.info("wasm initialized");

      const signer = await WebCryptoSigner.setup();

      const repo = new Repo({
        storage: new IndexedDBStorageAdapter(),
        signer,
        peerId: ("service-worker-" +
          (Math.random() * 10000).toString(36).slice(2)) as PeerId,
        async sharePolicy(peerId) {
          return peerId.includes("storage-server");
        },
        enableRemoteHeadsGossiping: true,
        subductionWebsocketEndpoints: SUBDUCTION_ENDPOINTS,
        network: [new WebSocketClientAdapter("wss://sync3.automerge.org")],
      });

      (self as any).repo = repo;
      logger.info("repo constructed, waiting for network subsystem");

      // Don't block getRepo() on whenReady() — the network subsystem starts
      // with only the subduction adapter, and the MessageChannel adapter is
      // added later via connectPort (which awaits getRepo). Blocking here
      // would deadlock that path and starve the fetch handler.
      repo.networkSubsystem.whenReady().then(() => {
        logger.info("repo network subsystem ready");
      });

      return repo;
    })();
  }
  return repoPromise;
}

// Connect client MessagePorts to the repo for sync
async function connectPort(port: MessagePort) {
  const repo = await getRepo();
  repo.networkSubsystem.addNetworkAdapter(
    new MessageChannelNetworkAdapter(port, { useWeakRef: true })
  );
}

self.addEventListener("message", async (event) => {
  if (event.data.type == "ping") {
    // Keepalive — Chromium idles out service workers after ~30s of inactivity.
    // Reply via the provided port if any; the message event itself also resets
    // the idle timer.
    const [pongPort] = event.ports;
    log("ping");
    if (pongPort) {
      pongPort.postMessage({ type: "pong" });
      log("pong");
      pongPort.close();
    } else if (event.source) {
      (event.source as unknown as Client).postMessage({ type: "pong" });
      log("pong");
    }
  } else if (event.data.type == "port") {
    log("received messagechannel");
    const [port] = event.ports;
    connectPort(port);
  } else if (event.data.type == "cachename") {
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

// ── Automerge URL resolution ───────────────────────────────────────────

async function resolveAutomergeUrl(automergeURL: URL): Promise<Response> {
  const repo = await getRepo();
  const href = automergeURL.href;
  const [maybeAutomergeUrl, ...path] = href.split("/");

  if (!isValidAutomergeUrl(maybeAutomergeUrl)) {
    return new Response("invalid automerge url", { status: 400 });
  }

  // Trim trailing empty path segment
  if (path.length && !path[path.length - 1]) path.pop();

  const { heads, documentId } = parseAutomergeUrl(maybeAutomergeUrl);
  const signal = AbortSignal.timeout(RESOLVE_TIMEOUT_MS);

  if (!heads) {
    const folder = await repo.find(maybeAutomergeUrl, { signal });
    const latestHeads = folder.heads();
    const url = stringifyAutomergeUrl({ documentId, heads: latestHeads });
    let location = `/${encodeURIComponent(url)}`;
    if (path.length) location += `/${path.join("/")}`;
    return Response.redirect(location, 307);
  }

  const rootHandle = await repo.find(maybeAutomergeUrl, { signal });

  const resolved = await resolvePath(
    repo,
    rootHandle,
    path.map(decodeURIComponent)
  );

  if (!resolved) {
    throw new Error(
      `couldn't resolve ${path.join("/")} in folder at ${maybeAutomergeUrl}`
    );
  }

  const body: BodyInit =
    resolved.content instanceof Uint8Array
      ? (new Uint8Array(resolved.content) as BlobPart)
      : resolved.content;

  const headers = new Headers({ "content-type": resolved.type });
  headers.set("cross-origin-embedder-policy", "credentialless");
  headers.set("cross-origin-resource-policy", "cross-origin");

  return new Response(body, { status: 200, headers });
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
            const headers = new Headers(match.headers);
            headers.set("cross-origin-embedder-policy", "credentialless");
            headers.set("cross-origin-resource-policy", "cross-origin");
            return new Response(match.body, {
              status: match.status,
              headers,
            });
          }

          const response = await Promise.race([
            resolveAutomergeUrl(specialURL),
            new Promise<never>((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new Error(`resolve timeout after ${RESOLVE_TIMEOUT_MS}ms`)
                  ),
                RESOLVE_TIMEOUT_MS
              )
            ),
          ]);

          if (response.status === 307) {
            return response;
          }

          if (cacheableStatuses.includes(response.status)) {
            log(`caching ${specialURL}`);
            await cache.put(request, response.clone());
          }

          return response;
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
          `service worker error resolving ${request.url}${specialURL ? ` (for: ${specialURL})` : ""}.\n${message}`
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
