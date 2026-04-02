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
import { WebCryptoSigner } from "@automerge/automerge-subduction/slim";

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

      // Fetch both Wasm binaries in parallel, then compile sequentially
      // (compilation order matters — subduction depends on automerge).
      logger.info("fetching wasm modules");
      const [amWasmBuf, sdnWasmBuf] = await Promise.all([
        fetch("/automerge.wasm").then((r) => r.arrayBuffer()),
        fetch("/subduction.wasm").then((r) => r.arrayBuffer()),
      ]);
      await initializeWasm(new Uint8Array(amWasmBuf));
      initSubductionSync(new Uint8Array(sdnWasmBuf));
      logger.info("wasm initialized");

      // Wait for the main thread to tell us the Subduction endpoint(s).
      // Overlap the WebCryptoSigner IDB key lookup with this wait.
      logger.info("waiting for subduction endpoints from main thread");
      const [signer] = await Promise.all([
        WebCryptoSigner.setup(),
        subductionReady,
      ]);
      logger.info("subduction endpoints received", {
        endpoints: subductionEndpoints,
      });

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

// ── Eager tool prefetch ────────────────────────────────────────────────
//
// As soon as the Repo is constructed, start syncing the module-settings
// docs and every tool folder doc they reference. This warms the
// Subduction sync pipeline so that by the time the main thread's
// ModuleWatcher fires fetch requests for package.json / entry-point JS,
// the folder docs (and ideally their file sub-docs) are already loaded
// or well on their way.

interface ModuleSettingsDoc {
  modules?: string[];
}

async function prefetchToolDocs(settingsUrls: string[]): Promise<void> {
  const repo = await getRepo();
  const logger = await slog;
  const seenModules = new Set<string>();
  const seenFiles = new Set<string>();

  // When a tool folder doc arrives (or updates), start syncing all
  // file sub-docs (package.json, dist/index.js, etc.) so they're
  // already loading by the time a fetch request arrives for them.
  function prefetchFileDocs(folderDoc: FolderDoc | undefined) {
    const docs = folderDoc?.docs;
    if (!Array.isArray(docs)) return;
    for (const entry of docs) {
      const fileUrl = entry?.url;
      if (!fileUrl || seenFiles.has(fileUrl)) continue;
      if (!isValidAutomergeUrl(fileUrl)) continue;
      seenFiles.add(fileUrl);
      repo.find(fileUrl).catch(() => {});
    }
  }

  for (const url of settingsUrls) {
    if (!isValidAutomergeUrl(url)) continue;
    logger.info(`prefetch: warming module-settings doc ${url.slice(0, 30)}…`);

    try {
      const handle = await repo.find<ModuleSettingsDoc>(url);

      // Read whatever modules are already present (may be empty on first load).
      const prefetchModules = (doc: ModuleSettingsDoc | undefined) => {
        const modules = doc?.modules ?? [];
        for (const modUrl of modules) {
          if (!modUrl || seenModules.has(modUrl)) continue;
          if (!isValidAutomergeUrl(modUrl)) continue;
          seenModules.add(modUrl);
          // Fire-and-forget: repo.find() starts SubductionSource sync.
          // When the folder doc arrives, prefetch its file sub-docs too.
          repo
            .find<FolderDoc>(modUrl)
            .then((folderHandle: any) => {
              prefetchFileDocs(folderHandle.doc());
              folderHandle.on("change", () => {
                prefetchFileDocs(folderHandle.doc());
              });
            })
            .catch(() => {});
        }
      };

      // Prefetch whatever's available immediately.
      prefetchModules(handle.doc());

      // Also watch for the settings doc to sync — on first load the
      // modules[] array arrives incrementally.
      handle.on("change", () => {
        prefetchModules(handle.doc());
      });
    } catch (err: unknown) {
      logger.warn(`prefetch: failed for ${url}`, err);
    }
  }

  logger.info(`prefetch: warmed ${seenModules.size} tool folder docs`);
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

    // Eagerly prefetch tool folder docs so Subduction sync is already
    // in progress by the time the first fetch request arrives.
    const settingsUrls: string[] = event.data.moduleSettingsUrls ?? [];
    if (settingsUrls.length > 0) {
      prefetchToolDocs(settingsUrls).catch((err: unknown) =>
        console.warn("[sw] prefetch failed:", err)
      );
    }
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

// ── In-memory response cache ───────────────────────────────────────────
//
// Keyed by canonical Automerge path (e.g. "automerge:3abc.../dist/index.js").
// Entries are evicted when the folder doc's `docs` array changes, which
// covers both initial sync arrival and HMR updates via `lastSyncAt`.
//
// This bypasses the HTTP Cache API entirely, avoiding the `?t=Date.now()`
// cache-buster that packages.ts appends. On first load this eliminates
// redundant Automerge doc walks for the ~200 fetch requests that all go
// through resolveAutomergeUrl.

interface CacheEntry {
  response: Response;
  folderDocId: string;
}

const responseCache = new Map<string, CacheEntry>();

// Coalesce concurrent requests for the same canonical path.
// If a resolve is already in flight, subsequent callers await the same promise
// instead of starting a parallel Automerge doc walk.
const inflightResolves = new Map<string, Promise<Response>>();

// Track which folder docs we've already subscribed to for invalidation.
const watchedFolders = new Set<string>();

function watchFolderForInvalidation(folderHandle: any, folderDocId: string) {
  if (watchedFolders.has(folderDocId)) return;
  watchedFolders.add(folderDocId);

  folderHandle.on("change", () => {
    // Evict all cached responses for this folder.
    for (const [key, entry] of responseCache) {
      if (entry.folderDocId === folderDocId) {
        responseCache.delete(key);
      }
    }
  });
}

// ── Automerge URL resolution ───────────────────────────────────────────

async function resolveAutomergeUrl(automergeURL: URL): Promise<Response> {
  const repo = await getRepo();
  const logger = await slog;
  const [maybeAutomergeUrl, ...path] = automergeURL.href.split("/");

  if (!isValidAutomergeUrl(maybeAutomergeUrl)) {
    return new Response("invalid automerge url", { status: 400 });
  }

  // Trim trailing empty path segment
  if (path.length && !path[path.length - 1]) path.pop();

  const { heads, documentId } = parseAutomergeUrl(maybeAutomergeUrl);

  // ── In-memory cache lookup ──────────────────────────────────────────
  // Key is the canonical automerge URL + path, ignoring query params
  // (e.g. ?t=<timestamp> cache busters from packages.ts).
  const cacheKey =
    maybeAutomergeUrl + (path.length ? "/" + path.join("/") : "");
  const cached = responseCache.get(cacheKey);
  if (cached) {
    log(`in-memory cache hit: ${cacheKey}`);
    return cached.response.clone();
  }

  // ── Request coalescing ────────────────────────────────────────────
  // If another caller is already resolving this exact path, piggyback
  // on that promise instead of doing a parallel Automerge doc walk.
  const inflight = inflightResolves.get(cacheKey);
  if (inflight) {
    log(`coalescing request: ${cacheKey}`);
    const coalesced = await inflight;
    return coalesced.clone();
  }

  const resolvePromise = resolveAutomergeUrlInner(
    repo,
    logger,
    maybeAutomergeUrl,
    path,
    documentId,
    cacheKey
  );
  inflightResolves.set(cacheKey, resolvePromise);
  try {
    return await resolvePromise;
  } finally {
    inflightResolves.delete(cacheKey);
  }
}

async function resolveAutomergeUrlInner(
  repo: Repo,
  logger: any,
  maybeAutomergeUrl: string,
  path: string[],
  documentId: string,
  cacheKey: string
): Promise<Response> {
  // NOTE: previously this redirected headless URLs to pinned-heads URLs
  // (307 redirect). Removed because during initial sync, folder docs are
  // partially loaded — pinning captures incomplete state and defeats retries.
  // The heads parameter is now treated as optional; we always serve the
  // latest state.

  // Wait for the folder doc to have the entry we need before resolving.
  // On first load, folder docs sync incrementally — the `docs` array
  // starts empty and fills in as Automerge changes arrive.
  const folderHandle = await repo.find<FolderDoc>(
    maybeAutomergeUrl as import("@automerge/automerge-repo/slim").AutomergeUrl
  );
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
    if (debugging) {
      logger.debug(
        `resolve ${documentId.slice(0, 8)} pkgFileHandle=${pkgFileHandle ? "found" : "null"}`
      );
    }
    if (pkgFileHandle) {
      const pkgDoc = pkgFileHandle.doc() as unknown as FileDoc | undefined;
      if (pkgDoc?.content) {
        const pkgJson = JSON.parse(String(pkgDoc.content));
        try {
          const resolved = resolvePackageExport(pkgJson);
          if (debugging) {
            logger.debug(
              `resolve ${documentId.slice(0, 8)} resolved=${resolved}`
            );
          }
          if (resolved) {
            const resolvedPath = resolved.replace(/^\.\//, "").split("/");
            fileHandle = await findHandleInFolderHandle<FileDoc>(
              repo,
              folderHandle,
              resolvedPath
            );
          }
        } catch (e) {
          logger.warn(
            `resolve ${documentId.slice(0, 8)} resolvePackageExport threw`,
            e
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
    const msg = `file at ${cacheKey} has no content (timed out)`;
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

  const response = new Response(body, { status: 200, headers });

  // ── Store in in-memory cache ──────────────────────────────────────
  // Watch the folder doc so we evict when it changes (HMR / sync updates).
  watchFolderForInvalidation(folderHandle, documentId);
  responseCache.set(cacheKey, {
    response: response.clone(),
    folderDocId: documentId,
  });

  return response;
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
      // Strip query parameters (e.g. ?t=<timestamp> cache busters from
      // packages.ts) so the in-memory response cache can match on the
      // canonical Automerge path regardless of cache-bust suffixes.
      const decoded = decodeURIComponent(url.pathname.slice(1));
      const sansQuery = decoded.replace(/\?.*$/, "");
      specialURL = new URL(sansQuery);
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
