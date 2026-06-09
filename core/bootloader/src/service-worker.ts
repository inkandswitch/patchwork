/// <reference types="service-worker-types" />

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
declare const __KEYHIVE_SYNC_SERVER__: boolean;

// TEMPORARY: enable debug npm module in SW context (no localStorage available)

let cachename = "default";
let debugging = false;
const workerInstanceId = crypto.randomUUID();

// Sync server selection. Sub is the default. Build with KEYHIVE_SYNC_SERVER=true
// to target keyhive.sync.automerge.org.
const useKeyhiveSyncServer =
  typeof __KEYHIVE_SYNC_SERVER__ !== "undefined" && __KEYHIVE_SYNC_SERVER__;

// Set the correct env var for automerge_repo_keyhive if need be.
if (useKeyhiveSyncServer) {
  (globalThis as any).process = (globalThis as any).process ?? {};
  (globalThis as any).process.env = {
    ...((globalThis as any).process.env ?? {}),
    KEYHIVE_SERVER_IDENTITY: "keyhive-sync",
  };
}

const SUBDUCTION_ENDPOINTS = [
  useKeyhiveSyncServer
    ? "wss://keyhive.sync.automerge.org"
    : "wss://subduction.sync.inkandswitch.com",
];
const RESOLVE_TIMEOUT_MS = 30_000;

const DEFAULT_CLASSIC_SYNC_SERVER = "wss://sync3.automerge.org";

let classicSyncServer = DEFAULT_CLASSIC_SYNC_SERVER;
let classicSyncAdapter: WebSocketClientAdapter | null = null;
let classicSyncConnectPromise: Promise<void> | null = null;

async function connectClassicSyncNetwork(server: string): Promise<void> {
  const url = server.trim() || DEFAULT_CLASSIC_SYNC_SERVER;
  if (classicSyncConnectPromise && classicSyncServer === url) {
    return classicSyncConnectPromise;
  }

  if (classicSyncAdapter && classicSyncServer !== url) {
    classicSyncAdapter.disconnect();
    classicSyncAdapter = null;
    classicSyncConnectPromise = null;
  }

  classicSyncServer = url;
  classicSyncConnectPromise = (async () => {
    const { repo } = await getRepoHive();
    if (!classicSyncAdapter) {
      classicSyncAdapter = new WebSocketClientAdapter(url);
      repo.networkSubsystem.addNetworkAdapter(classicSyncAdapter);
    }
    await classicSyncAdapter.whenReady();
    log("classic sync connected", { server: url });
  })();

  try {
    await classicSyncConnectPromise;
  } catch (err) {
    classicSyncConnectPromise = null;
    throw err;
  }
}

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

let repoHivePromise: Promise<{
  repo: Repo;
  hive?: AutomergeRepoKeyhiveRust;
}> | null = null;

const useKeyhive = typeof __KEYHIVE__ !== "undefined" && __KEYHIVE__;

function getRepoHive() {
  if (!repoHivePromise) {
    repoHivePromise = (async () => {
      log("getRepo: starting");

      log("fetching wasm modules");
      const [amWasmBuf, sdnWasmBuf] = await Promise.all([
        fetch("/automerge.wasm?sw").then((r) => r.arrayBuffer()),
        fetch("/subduction.wasm").then((r) => r.arrayBuffer()),
      ]);
      initSubductionSync(new Uint8Array(sdnWasmBuf));
      await initializeWasm(new Uint8Array(amWasmBuf));
      log("wasm initialized");

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
        log("repo constructed (no keyhive), waiting for network subsystem");

        repo.networkSubsystem.whenReady().then(() => {
          log("repo network subsystem ready");
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
      });

      repo.subduction.then(resolveRepoSubduction);

      hive.linkRepo(repo);

      (self as any).repo = repo;
      (self as any).hive = hive;
      log("repo constructed, waiting for network subsystem");

      // Don't block getRepoHive() on whenReady() — the network subsystem starts
      // with only the subduction adapter, and the MessageChannel adapter is
      // added later via connectPort (which awaits getRepoHive). Blocking here
      // would deadlock that path and starve the fetch handler.
      repo.networkSubsystem.whenReady().then(() => {
        log("repo network subsystem ready");
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

// Per-tab MessageChannel connections, keyed by the client (window) id so we can
// tear them down when the tab goes away. `adapter` is what was registered with
// the network subsystem (the MessageChannelNetworkAdapter, or the keyhive
// wrapper around it); `mcAdapter` is always the underlying MessageChannel
// adapter so we can disconnect the port itself.
type TabConnection = {
  adapter: { disconnect(): void };
  mcAdapter: MessageChannelNetworkAdapter;
  port: MessagePort;
};
const tabConnections = new Map<string, TabConnection>();

function dropConnection(repo: Repo, conn: TabConnection) {
  // removeNetworkAdapter pulls the adapter out of networkSubsystem.adapters and
  // calls adapter.disconnect(), which (for the MessageChannel adapter) emits the
  // "close"/"peer-disconnected" events that also clear #adaptersByPeer.
  try {
    repo.networkSubsystem.removeNetworkAdapter(conn.adapter as any);
  } catch (err) {
    console.error("removeNetworkAdapter failed", err);
  }
  // Belt and braces for the keyhive path, where the registered adapter is a
  // wrapper: make sure the underlying port is disconnected and closed too.
  try {
    conn.mcAdapter.disconnect();
  } catch {}
  try {
    conn.port.close();
  } catch {}
}

// Remove network adapters for tabs that no longer exist. Service workers get no
// reliable disconnect signal when a tab closes, and useWeakRef cleanup only
// fires lazily on the next postMessage to a GC'd port — which never comes for an
// idle peer. So we reconcile against the live window clients instead.
async function reconcileConnections() {
  if (!repoHivePromise || tabConnections.size === 0) return;
  const { repo } = await getRepoHive();
  const live = new Set(
    (
      await (self as any).clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      })
    ).map((c: Client) => c.id)
  );
  for (const [clientId, conn] of tabConnections) {
    if (live.has(clientId)) continue;
    tabConnections.delete(clientId);
    log(`tab ${clientId} gone — removing its network adapter`);
    dropConnection(repo, conn);
  }
}

// Connect client MessagePorts to the repo for sync
async function connectPort(port: MessagePort, clientId?: string) {
  const { hive, repo } = await getRepoHive();
  const networkAdapter = new MessageChannelNetworkAdapter(port, { useWeakRef: true });

  // If this client already had a connection (e.g. it reconnected after the SW
  // restarted), tear the stale one down before registering the new one.
  const track = (adapter: { disconnect(): void }) => {
    if (!clientId) return;
    const stale = tabConnections.get(clientId);
    if (stale) dropConnection(repo, stale);
    tabConnections.set(clientId, { adapter, mcAdapter: networkAdapter, port });
  };

  if (!hive) {
    repo.networkSubsystem.addNetworkAdapter(networkAdapter);
    track(networkAdapter);
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
  track(keyhiveNetworkAdapter);
}

self.addEventListener("message", async (event) => {
  if (event.data.type == "ping") {
    // Keepalive — Chromium idles out service workers after ~30s of inactivity.
    // Reply via the provided port if any; the message event itself also resets
    // the idle timer.
    const [pongPort] = event.ports;
    log("ping!");
    // Opportunistically reap adapters for tabs that have since closed.
    (event as unknown as FetchEvent).waitUntil(reconcileConnections());
    if (pongPort) {
      pongPort.postMessage({ type: "pong", workerInstanceId });
      log("pong!");
      pongPort.close();
    } else if (event.source) {
      (event.source as unknown as Client).postMessage({
        type: "pong",
        workerInstanceId,
      });
      log("pong!!");
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
      connectPort(port, source?.id).then(
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
  } else if (event.data.type == "connect-classic-sync") {
    const [replyPort] = event.ports;
    const server =
      typeof event.data.server === "string"
        ? event.data.server
        : DEFAULT_CLASSIC_SYNC_SERVER;
    (event as unknown as FetchEvent).waitUntil(
      connectClassicSyncNetwork(server)
        .then(() => {
          replyPort?.postMessage({ type: "connect-classic-sync-ready" });
          replyPort?.close();
          log("classic sync connected on demand", { server });
        })
        .catch((err) => {
          console.error("connectClassicSyncNetwork failed", err);
          replyPort?.postMessage({
            type: "connect-classic-sync-failed",
            error: String(err),
          });
          replyPort?.close();
        })
    );
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
