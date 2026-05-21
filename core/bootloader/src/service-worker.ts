/// <reference types="service-worker-types" />

import { SwLogger } from "./sw-logger.js";

// Heavy imports — marked external by the service-worker vite plugin,
// resolved to /packages/... URLs at build time. The SW is registered with
// type:"module" so the browser fetches these as regular network requests.
// Uses /slim to avoid top-level await (disallowed in service workers).
// Wasm is fetched from /automerge.wasm (emitted by the vite plugin) instead
// of bundling the ~3MB base64 string.
import { initializeWasm, hasHeads } from "@automerge/automerge/slim";
// eslint-disable-next-line
// @ts-ignore — initSync is a wasm-bindgen runtime helper not in the .d.ts
import { initSync as initSubductionSync } from "@automerge/automerge-subduction/slim";
import { WebCryptoSigner } from "@automerge/automerge-subduction/slim";

import {
  Repo,
  isValidAutomergeUrl,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  type AutomergeUrl,
} from "@automerge/automerge-repo/slim";
import { resolvePath } from "@inkandswitch/patchwork-filesystem";

// Small adapters — bundled directly into the SW
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import {
  initializeAutomergeRepoKeyhiveRust,
  initKeyhiveWasm,
  type AutomergeRepoKeyhiveRust,
} from "@automerge/automerge-repo-keyhive";

declare const __SITE_NAME__: string;
declare const __KEYHIVE__: boolean;

// TEMPORARY: enable debug npm module in SW context (no localStorage available)

let cachename = "default";
let debugging = false;
const workerInstanceId = crypto.randomUUID();

const SUBDUCTION_ENDPOINTS = ["wss://keyhive.sync.automerge.org"];

const RESOLVE_TIMEOUT_MS = 30_000;

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

const siteName = typeof __SITE_NAME__ !== "undefined" ? __SITE_NAME__ : "tiny-patchwork";

const cacheableStatuses = [200, 203, 204, 206];

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

let repoHivePromise: Promise<{
  repo: Repo;
  hive?: AutomergeRepoKeyhiveRust;
}> | null = null;

const useKeyhive = typeof __KEYHIVE__ !== "undefined" && __KEYHIVE__;

function getRepoHive() {
  if (!repoHivePromise) {
    repoHivePromise = (async () => {
      const logger = await slog;
      logger.info("getRepo: starting");

      logger.info("fetching wasm modules");
      const [amWasmBuf, sdnWasmBuf] = await Promise.all([
        fetch("/automerge.wasm?sw").then((r) => r.arrayBuffer()),
        fetch("/subduction.wasm").then((r) => r.arrayBuffer()),
      ]);
      initSubductionSync(new Uint8Array(sdnWasmBuf));
      await initializeWasm(new Uint8Array(amWasmBuf));
      logger.info("wasm initialized");

      if (!useKeyhive) {
        const signer = await WebCryptoSigner.setup();

        const repo = new Repo({
          storage: new IndexedDBStorageAdapter(),
          signer,
          peerId: ("service-worker-" +
            Math.random().toString(36).slice(2)) as import("@automerge/automerge-repo/slim").PeerId,
          async sharePolicy(peerId) {
            return peerId.includes("storage-server");
          },
          enableRemoteHeadsGossiping: true,
          subductionWebsocketEndpoints: SUBDUCTION_ENDPOINTS,
        });

        (self as any).repo = repo;
        logger.info("repo constructed (no keyhive), waiting for network subsystem");

        repo.networkSubsystem.whenReady().then(() => {
          logger.info("repo network subsystem ready");
        });

        return { repo };
      }

      initKeyhiveWasm();
      const keyhiveStorage = new IndexedDBStorageAdapter(
        `${siteName}-keyhive`
      );

      // Keyhive bootstrap needs to run before Repo creation but
      // the adapter needs the subduction instance from the Repo.
      // A deferred promise breaks the cycle.
      let resolveRepoSubduction!: (s: any) => void;
      const repoSubductionPromise = new Promise((resolve) => {
        resolveRepoSubduction = resolve;
      });

      // We use the Rust variant of Keyhive initialization to talk
      // to the Rust keyhive-enabled subduction sync server.
      const hive = await initializeAutomergeRepoKeyhiveRust({
        storage: keyhiveStorage,
        peerIdSuffix:
          `${siteName}-worker` + Math.random().toString(36).slice(2),
        subduction: repoSubductionPromise as any,
        automaticArchiveIngestion: true,
        cachingMode: "periodic",
      });

      const signer = await hive.constructSubductionSigner();

      const repo = new Repo({
        storage: new IndexedDBStorageAdapter(),
        signer,
        subductionWebsocketEndpoints: SUBDUCTION_ENDPOINTS,
        peerId: hive.peerId,
        enableRemoteHeadsGossiping: true,
        idFactory: hive.idFactory,
        // subductionBlobInterceptor: hive.blobInterceptor,
        //network: [new WebSocketClientAdapter("wss://sync3.automerge.org")],
      });

      repo.subduction.then(resolveRepoSubduction);

      hive.linkRepo(repo);

      (self as any).repo = repo;
      (self as any).hive = hive;
      logger.info("repo constructed, waiting for network subsystem");

      // Don't block getRepoHive() on whenReady() — the network subsystem starts
      // with only the subduction adapter, and the MessageChannel adapter is
      // added later via connectPort (which awaits getRepoHive). Blocking here
      // would deadlock that path and starve the fetch handler.
      repo.networkSubsystem.whenReady().then(() => {
        logger.info("repo network subsystem ready");
      });

      hive.networkAdapter.whenReady().then(() => {
        (hive.networkAdapter as any).syncKeyhive();
      });

      return { hive, repo };
    })();
    // If construction fails (e.g. wasm fetch errors out because the SW was
    // terminated mid-flight), don't permanently cache the rejection — clear
    // the slot so the next caller can retry from scratch.
    repoHivePromise.catch(() => {
      repoHivePromise = null;
    });
  }
  return repoHivePromise;
}

// Connect client MessagePorts to the repo for sync
async function connectPort(port: MessagePort) {
  const { hive, repo } = await getRepoHive();
  const networkAdapter = new MessageChannelNetworkAdapter(port, { useWeakRef: true });

  if (!hive) {
    repo.networkSubsystem.addNetworkAdapter(networkAdapter);
    return;
  }

  const onlyShareWithHardcodedServerPeerId = false;
  const periodicallyRequestKeyhiveSync = false;
  const keyhiveNetworkAdapter = hive.createKeyhiveNetworkAdapter(networkAdapter, onlyShareWithHardcodedServerPeerId, periodicallyRequestKeyhiveSync, 2000);

  keyhiveNetworkAdapter.on("message", async (msg: any) => {
    if ((msg.type === "sync" || msg.type === "request") && msg.documentId) {
      const handle = repo.handles[msg.documentId];
      if (!handle || handle.state === "unavailable") {
        const url = `automerge:${msg.documentId}` as AutomergeUrl;
        repo.findWithProgress(url);
        repo.shareConfigChanged();
      }
    }
  });

  (keyhiveNetworkAdapter as any).on("ingest-remote", () => {
    (hive.networkAdapter as any).syncKeyhive?.();
    repo.shareConfigChanged();
  });

  repo.networkSubsystem.addNetworkAdapter(keyhiveNetworkAdapter);
}

self.addEventListener("message", async (event) => {
  if (event.data.type == "ping") {
    // Keepalive — Chromium idles out service workers after ~30s of inactivity.
    // Reply via the provided port if any; the message event itself also resets
    // the idle timer.
    const [pongPort] = event.ports;
    log("ping");
    if (pongPort) {
      pongPort.postMessage({ type: "pong", workerInstanceId });
      log("pong");
      pongPort.close();
    } else if (event.source) {
      (event.source as unknown as Client).postMessage({
        type: "pong",
        workerInstanceId,
      });
      log("pong");
    }
  } else if (event.data.type == "port") {
    log("received messagechannel");
    const [port] = event.ports;
    const source = event.source as Client | null;
    const id = event.data.id;
    // event.waitUntil keeps the SW alive until the work completes. Without
    // it, the browser can terminate the SW the moment this synchronous block
    // returns, killing the in-flight wasm fetch.
    (event as unknown as FetchEvent).waitUntil(
      connectPort(port).then(
        () => source?.postMessage({ type: "port-ready", id, workerInstanceId }),
        (err) => {
          console.error("connectPort failed", err);
          // Tell the client we failed so it doesn't hang forever.
          source?.postMessage({
            type: "port-failed",
            id,
            error: String(err),
            workerInstanceId,
          });
        }
      )
    );
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
  const { repo } = await getRepoHive();
  const href = automergeURL.href;
  const [maybeAutomergeUrl, ...path] = href.split("/");

  if (!isValidAutomergeUrl(maybeAutomergeUrl)) {
    return new Response("invalid automerge url", { status: 400 });
  }

  // Trim trailing empty path segment
  if (path.length && !path[path.length - 1]) path.pop();

  const { heads, hexHeads, documentId } = parseAutomergeUrl(maybeAutomergeUrl);
  const signal = AbortSignal.timeout(RESOLVE_TIMEOUT_MS);

  if (!heads) {
    const folder = await repo.find(maybeAutomergeUrl, { signal });
    const latestHeads = folder.heads();
    const url = stringifyAutomergeUrl({ documentId, heads: latestHeads });
    let location = `/${encodeURIComponent(url)}`;
    if (path.length) location += `/${path.join("/")}`;
    return Response.redirect(location, 307);
  }

  // Load by documentId only so we can verify the requested heads are actually
  // in our local history. repo.find with a heads-bearing URL returns a view
  // at those heads, which silently materializes garbage if we never synced them.
  const baseHandle = await repo.find(stringifyAutomergeUrl({ documentId }), {
    signal,
  });
  if (!hasHeads(baseHandle.doc(), hexHeads ?? [])) {
    return new Response("heads not found", { status: 404 });
  }
  const rootHandle = baseHandle.view(heads);

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
        const logger = await slog;
        logger.error(
          `service worker error resolving ${request.url}${specialURL ? ` (for: ${specialURL})` : ""}`,
          {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          }
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
