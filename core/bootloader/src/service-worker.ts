/// <reference types="service-worker-types" />

import { SwLogger, type SwLoggerInterface } from "./sw-logger.js";

// Heavy imports — marked external by the service-worker vite plugin,
// resolved to /packages/... URLs at build time. The SW is registered with
// type:"module" so the browser fetches these as regular network requests.
// Uses /slim to avoid top-level await (disallowed in service workers).
// Wasm is fetched from /automerge.wasm (emitted by the vite plugin) instead
// of bundling the ~3MB base64 string.
import { initializeWasm } from "@automerge/automerge/slim";
import {
  Repo,
  isValidAutomergeUrl,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  type PeerId,
} from "@automerge/automerge-repo/slim";
import {
  findHandleInFolderHandle,
  resolvePackageExport,
  type FolderDoc,
} from "@inkandswitch/patchwork-filesystem";

// Small adapters — bundled directly into the SW
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";

let cachename = "default";
let debugging = false;

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

// Track WebSocket adapters by URL so we can remove them
const syncAdapters = new Map<string, WebSocketClientAdapter>();

// Resolves when the main thread tells us which sync server to use
let resolveSyncServer: (url: string) => void;
const syncServerReady = new Promise<string>((resolve) => {
  resolveSyncServer = resolve;
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

      logger.info("initializing wasm");
      const wasmResponse = await fetch("/automerge.wasm");
      await initializeWasm(new Uint8Array(await wasmResponse.arrayBuffer()));
      logger.info("wasm initialized");

      // Wait for the main thread to tell us which sync server to use
      logger.info("waiting for sync server URL from main thread");
      const syncServerUrl = await syncServerReady;
      logger.info("sync server URL received", { url: syncServerUrl });
      const syncAdapter = new WebSocketClientAdapter(syncServerUrl);
      syncAdapters.set(syncServerUrl, syncAdapter);

      const repo = new Repo({
        storage: new IndexedDBStorageAdapter(),
        network: [syncAdapter],
        peerId: ("service-worker-" +
          (Math.random() * 10000).toString(36).slice(2)) as PeerId,
        async sharePolicy(peerId) {
          return peerId.includes("storage-server");
        },
        enableRemoteHeadsGossiping: true,
      });

      (self as any).repo = repo;
      logger.info("repo constructed, waiting for network subsystem");
      await repo.networkSubsystem.whenReady();
      logger.info("repo network subsystem ready");

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
  if (event.data.type == "port") {
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
  } else if (event.data.type == "set-sync-server") {
    const url: string = event.data.url;
    // Unblock getRepo() — it waits for this before creating the WebSocket
    resolveSyncServer(url);
    // Wait for the repo (and its WebSocket) to be fully ready, then ack
    await getRepo();
    const [ackPort] = event.ports;
    if (ackPort) {
      ackPort.postMessage("ready");
      ackPort.close();
    }
    log(`set sync server: ${url}`);
  } else if (event.data.type == "add-sync-server") {
    const url: string = event.data.url;
    if (!syncAdapters.has(url)) {
      const repo = await getRepo();
      const adapter = new WebSocketClientAdapter(url);
      syncAdapters.set(url, adapter);
      repo.networkSubsystem.addNetworkAdapter(adapter);
      log(`added sync server: ${url}`);
    }
  } else if (event.data.type == "remove-sync-server") {
    const url: string = event.data.url;
    const adapter = syncAdapters.get(url);
    if (adapter) {
      adapter.disconnect();
      syncAdapters.delete(url);
      log(`removed sync server: ${url}`);
    }
  }
});

interface FileDoc {
  content: string | Uint8Array;
  mimeType?: string;
}

// ── Automerge URL resolution ───────────────────────────────────────────

async function resolveAutomergeUrl(automergeURL: URL): Promise<Response> {
  const repo = await getRepo();
  const logger = await slog;
  const href = automergeURL.href;
  const [maybeAutomergeUrl, ...path] = href.split("/");

  if (!isValidAutomergeUrl(maybeAutomergeUrl)) {
    return new Response("invalid automerge url", { status: 400 });
  }

  // Trim trailing empty path segment
  if (path.length && !path[path.length - 1]) path.pop();

  const { heads, documentId } = parseAutomergeUrl(maybeAutomergeUrl);

  if (!heads) {
    // Redirect to pinned-heads URL
    const folder = await repo.find(maybeAutomergeUrl);
    const latestHeads = folder.heads();
    const url = stringifyAutomergeUrl({ documentId, heads: latestHeads });
    let location = `/${encodeURIComponent(url)}`;
    if (path.length) location += `/${path.join("/")}`;
    return Response.redirect(location, 307);
  }

  // If no path, check if this is a package with exports to resolve
  // e.g. /automerge%3Adocid/abc → resolve "abc" via package.json exports
  const folderHandle = await repo.find<FolderDoc>(maybeAutomergeUrl);

  if (debugging) {
    const folderDoc = folderHandle.doc();
    const docNames = folderDoc?.docs?.map((d: any) => d.name) ?? [];
    logger.debug(
      `resolve ${documentId.slice(0, 8)} path=[${path.join("/")}] heads=${folderHandle.heads()?.length ?? 0} docs=[${docNames.join(",")}]`
    );
  }

  let fileHandle;
  if (path.length) {
    // Try direct file navigation first
    fileHandle = await findHandleInFolderHandle<FileDoc>(
      repo,
      folderHandle,
      path.map(decodeURIComponent)
    );

    // If not found as a direct path, try resolving as a package subpath export
    // e.g. /automerge%3Adocid/abc → exports["./abc"] → "./dist/abc.js"
    if (!fileHandle) {
      const subpath = "./" + path.map(decodeURIComponent).join("/");
      const pkgFileHandle = await findHandleInFolderHandle<FileDoc>(
        repo,
        folderHandle,
        ["package.json"]
      );
      if (pkgFileHandle) {
        const pkgDoc = pkgFileHandle.doc() as FileDoc | undefined;
        if (pkgDoc?.content) {
          const pkgJson = JSON.parse(String(pkgDoc.content));
          try {
            const resolved = resolvePackageExport(pkgJson, subpath);
            if (resolved) {
              const resolvedPath = resolved.replace(/^\.\//, "").split("/");
              fileHandle = await findHandleInFolderHandle<FileDoc>(
                repo,
                folderHandle,
                resolvedPath
              );
            }
          } catch {
            // not a valid export subpath, fall through to error
          }
        }
      }
    }
  } else {
    // No path — resolve the root export (like "." in package.json)
    const pkgFileHandle = await findHandleInFolderHandle<FileDoc>(
      repo,
      folderHandle,
      ["package.json"]
    );
    if (pkgFileHandle) {
      const pkgDoc = pkgFileHandle.doc() as FileDoc | undefined;
      if (pkgDoc?.content) {
        const pkgJson = JSON.parse(String(pkgDoc.content));
        try {
          const resolved = resolvePackageExport(pkgJson);
          if (resolved) {
            const resolvedPath = resolved.replace(/^\.\//, "").split("/");
            fileHandle = await findHandleInFolderHandle<FileDoc>(
              repo,
              folderHandle,
              resolvedPath
            );
          }
        } catch {}
      }
    }
  }

  if (!fileHandle) {
    const msg = `couldn't resolve ${path.join("/")} in folder at ${maybeAutomergeUrl}`;
    const names = folderHandle.doc()?.docs?.map((d: any) => d.name) ?? [];
    logger.warn(msg, { docs: names });
    throw new Error(msg);
  }

  const fileDoc = fileHandle.doc() as unknown as FileDoc;
  const content = fileDoc?.content;
  if (!content) {
    const msg = `file at ${href} has no content`;
    logger.warn(msg);
    throw new Error(msg);
  }

  let body: BodyInit =
    content instanceof Uint8Array
      ? (new Uint8Array(content) as BlobPart)
      : String(content);
  const mimeType = fileDoc.mimeType ?? "text/plain";

  const headers = new Headers({ "content-type": mimeType });
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

          const response = await resolveAutomergeUrl(specialURL);

          if (response.status === 307) {
            return response;
          }

          if (cacheableStatuses.includes(response.status)) {
            log(`caching ${specialURL}`);
            await cache.put(request, response.clone());
          }

          return response;
        } else {
          const response = await fetch(request);
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
