/// <reference types="service-worker-types" />

import { SwLogger, type SwLoggerInterface } from "./sw-logger.js";

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
import {
  setSubductionLogLevel,
  WebCryptoSigner,
} from "@automerge/automerge-subduction/slim";

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
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";

// TEMPORARY: enable debug npm module in SW context (no localStorage available)
import debug from "debug";
debug.enable("automerge-repo:subduction*");

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

// Resolves when the main thread tells us the Subduction endpoint(s)
let resolveSubductionReady: () => void;
let subductionEndpoints: string[] = [];
const subductionReady = new Promise<void>((resolve) => {
  resolveSubductionReady = resolve;
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

      const sdnWasmResponse = await fetch("/subduction.wasm");
      initSubductionSync(new Uint8Array(await sdnWasmResponse.arrayBuffer()));

      // TEMPORARY: enable verbose Subduction tracing in the SW for debugging
      (self as any).__SUBDUCTION_DEBUG = true;
      try {
        setSubductionLogLevel("debug");
      } catch {}

      // Wait for the main thread to tell us the Subduction endpoint(s)
      logger.info("waiting for subduction endpoints from main thread");
      await subductionReady;
      logger.info("subduction endpoints received", {
        endpoints: subductionEndpoints,
      });

      // Persistent signer — survives SW restarts via IndexedDB
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
        subductionWebsocketEndpoints: subductionEndpoints,
      });

      (self as any).repo = repo;
      logger.info("repo constructed, waiting for network subsystem");

      // Don't block getRepo() on whenReady() — the network subsystem starts
      // with no adapters (MessageChannel is added later via connectPort),
      // and blocking here prevents the fetch handler from serving requests.
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
  } else if (event.data.type == "set-subduction-endpoints") {
    const urls: string[] = event.data.urls;
    subductionEndpoints = urls;
    resolveSubductionReady();
    // Wait for the repo to be fully ready, then ack
    await getRepo();
    const [ackPort] = event.ports;
    if (ackPort) {
      ackPort.postMessage("ready");
      ackPort.close();
    }
    log(`set subduction endpoints: ${urls.join(", ")}`);
  }
});

interface FileDoc {
  content: string | Uint8Array;
  mimeType?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

const ENTRY_WAIT_TIMEOUT_MS = 60_000;

/**
 * Wait until a folder doc's `docs` array contains an entry with the given
 * name. Returns the entry if found, or `undefined` if the timeout expires.
 *
 * On first load, folder docs sync incrementally — the `docs` array starts
 * empty and entries appear one by one as Automerge changes arrive from the
 * Subduction sync server. This function blocks the fetch handler until the
 * needed entry is available, rather than immediately serving a 500 for data
 * that hasn't arrived yet.
 */
function waitForDocEntry(
  handle: any, // DocHandle<FolderDoc>
  entryName: string,
  timeoutMs = ENTRY_WAIT_TIMEOUT_MS
): Promise<any | undefined> {
  // Fast path: already present
  const doc = handle.doc();
  const found = doc?.docs?.find((d: any) => d.name === entryName);
  if (found) return Promise.resolve(found);

  return new Promise<any | undefined>((resolve) => {
    const timer = setTimeout(() => {
      handle.removeListener("change", onChange);
      resolve(undefined);
    }, timeoutMs);

    function onChange() {
      const doc = handle.doc();
      const entry = doc?.docs?.find((d: any) => d.name === entryName);
      if (entry) {
        clearTimeout(timer);
        handle.removeListener("change", onChange);
        resolve(entry);
      }
    }

    handle.on("change", onChange);
  });
}

/**
 * Determine the first path component we need to resolve in the folder.
 * For direct paths like `["dist", "index.js"]`, it's `"dist"`.
 * For root resolution (no path), we need `"package.json"`.
 */
function neededEntry(path: string[]): string {
  if (path.length > 0) {
    return decodeURIComponent(path[0]);
  }
  return "package.json";
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

  // NOTE: previously this redirected headless URLs to pinned-heads URLs
  // (307 redirect). Removed because during initial sync, folder docs are
  // partially loaded — pinning captures incomplete state and defeats retries.
  // The heads parameter is now treated as optional; we always serve the
  // latest state.

  // Wait for the folder doc to have the entry we need before resolving.
  // On first load, folder docs sync incrementally — the `docs` array
  // starts empty and fills in as Automerge changes arrive.
  const folderHandle = await repo.find<FolderDoc>(maybeAutomergeUrl);
  const needed = neededEntry(path);
  const entry = await waitForDocEntry(folderHandle, needed);

  if (debugging) {
    const folderDoc = folderHandle.doc();
    const docNames = folderDoc?.docs?.map((d: any) => d.name) ?? [];
    logger.debug(
      `resolve ${documentId.slice(0, 8)} path=[${path.join("/")}] heads=${folderHandle.heads()?.length ?? 0} docs=[${docNames.join(",")}]`
    );
  }

  if (!entry) {
    const names = folderHandle.doc()?.docs?.map((d: any) => d.name) ?? [];
    logger.warn(
      `timed out waiting for "${needed}" in folder ${documentId.slice(0, 8)}`,
      { docs: names }
    );
    throw new Error(
      `timed out waiting for "${needed}" in folder at ${maybeAutomergeUrl}`
    );
  }

  let fileHandle: any;
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
        const pkgDoc = pkgFileHandle.doc() as unknown as FileDoc | undefined;
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
    console.log(
      `[sw:resolve] ${documentId.slice(0, 8)} pkgFileHandle=${pkgFileHandle ? "found" : "null"}`
    );
    if (pkgFileHandle) {
      const pkgDoc = pkgFileHandle.doc() as unknown as FileDoc | undefined;
      console.log(
        `[sw:resolve] ${documentId.slice(0, 8)} pkgDoc.content=${
          pkgDoc?.content
            ? `${typeof pkgDoc.content}(${
                pkgDoc.content instanceof Uint8Array
                  ? pkgDoc.content.byteLength
                  : String(pkgDoc.content).length
              }b)`
            : "null"
        }`
      );
      if (pkgDoc?.content) {
        const pkgJson = JSON.parse(String(pkgDoc.content));
        try {
          const resolved = resolvePackageExport(pkgJson);
          console.log(
            `[sw:resolve] ${documentId.slice(0, 8)} resolved=${resolved}`
          );
          if (resolved) {
            const resolvedPath = resolved.replace(/^\.\//, "").split("/");
            fileHandle = await findHandleInFolderHandle<FileDoc>(
              repo,
              folderHandle,
              resolvedPath
            );
          }
        } catch (e) {
          console.log(
            `[sw:resolve] ${documentId.slice(0, 8)} resolvePackageExport threw: ${e}`
          );
        }
      }
    }
  }

  if (!fileHandle) {
    const msg = `couldn't resolve ${path.join("/")} in folder at ${maybeAutomergeUrl}`;
    const names = folderHandle.doc()?.docs?.map((d: any) => d.name) ?? [];
    logger.warn(msg, { docs: names });
    throw new Error(msg);
  }

  // Wait for the file doc to have content. On first load, the file handle
  // may exist (heads > 0) but its blob data hasn't been loaded yet.
  let fileDoc = fileHandle.doc() as unknown as FileDoc;
  if (!fileDoc?.content) {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        fileHandle.removeListener("change", onChange);
        resolve();
      }, ENTRY_WAIT_TIMEOUT_MS);

      function onChange() {
        const doc = fileHandle.doc() as unknown as FileDoc;
        if (doc?.content) {
          clearTimeout(timer);
          fileHandle.removeListener("change", onChange);
          resolve();
        }
      }

      fileHandle.on("change", onChange);
    });
    fileDoc = fileHandle.doc() as unknown as FileDoc;
  }

  const content = fileDoc?.content;
  if (!content) {
    const msg = `file at ${href} has no content (timed out)`;
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
