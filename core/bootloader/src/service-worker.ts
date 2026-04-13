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
import { MemorySigner } from "@automerge/automerge-subduction/slim";

import {
  Repo,
  isValidAutomergeUrl,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  type AutomergeUrl,
  type PeerId,
  type DocumentProgress,
  type DocHandle,
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
import {
  initializeAutomergeRepoKeyhive,
  initKeyhiveWasm,
  verifyingKeyPeerIdWithoutSuffix,
} from "@automerge/automerge-repo-keyhive";

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
let siteName = "tiny-patchwork";
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

self.onerror = (event: any, source: any, lineno: any, colno: any, error: any) => {
  console.error("[service worker: ERROR]", {
    event,
    source,
    lineno,
    colno,
    error: error?.message,
    stack: error?.stack,
  });
};

self.addEventListener("unhandledrejection", (event) => {
  console.error("[service worker: UNHANDLED REJECTION]", String(event.reason));
  event.preventDefault();
});

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
  hive: any;
  unavailableDocs: Map<string, string>;
  schedulePeriodicRetry: () => void;
}> | null = null;

function getRepoHive() {
  if (!repoHivePromise) {
    repoHivePromise = (async () => {
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

      initKeyhiveWasm();

      // Wait for the main thread to tell us the Subduction endpoint(s).
      logger.info("waiting for subduction endpoints from main thread");
      await subductionReady;
      logger.info("subduction endpoints received", {
        endpoints: subductionEndpoints,
      });

      const serverUrl = subductionEndpoints[0];
      const keyhiveStorage = new IndexedDBStorageAdapter(`${siteName}-keyhive`);
      const keyhiveNetwork = new WebSocketClientAdapter(serverUrl);

      const hive = await initializeAutomergeRepoKeyhive({
        storage: keyhiveStorage,
        peerIdSuffix: `${siteName}-worker` + Math.random().toString(36).slice(2),
        networkAdapter: keyhiveNetwork,
        automaticArchiveIngestion: true,
        cachingMode: "periodic",
        onlyShareWithHardcodedServerPeerId: true,
      });

      // Construct subduction signer from keyhive's Ed25519 key pair
      // so both keyhive and subduction use the same identity
      const keyPair = hive.active.keyPair;
      const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
      const secretKeyBytes = new Uint8Array(
        atob(privateJwk.d!.replace(/-/g, '+').replace(/_/g, '/'))
          .split('').map(c => c.charCodeAt(0))
      );
      const signer = MemorySigner.fromBytes(secretKeyBytes);

      const repo = new Repo({
        storage: new IndexedDBStorageAdapter(),
        signer,
        network: [],
        subductionAdapters: [{
          adapter: hive.networkAdapter,
          serviceName: serverUrl,
          role: "connect",
        }],
        peerId: hive.peerId,
        enableRemoteHeadsGossiping: true,
        idFactory: hive.idFactory,
      });

      hive.linkRepo(repo);

      (self as any).repo = repo;
      (self as any).hive = hive;
      logger.info("repo constructed, waiting for network subsystem");

      // Don't block on whenReady() — the network subsystem starts
      // with no adapters (MessageChannel is added later via connectPort),
      // and blocking here prevents the fetch handler from serving requests.
      repo.networkSubsystem.whenReady().then(() => {
        logger.info("repo network subsystem ready");
      });

      // Track unavailable documents for retry
      const unavailableDocs = new Map<string, string>();

      function retryUnavailableDocs() {
        for (const [documentId, url] of unavailableDocs) {
          unavailableDocs.delete(documentId);
          repo.findWithProgress(url as AutomergeUrl);
        }
        // Always call shareConfigChanged so subduction retries
        // heal-exhausted syncs after keyhive access propagates
        repo.shareConfigChanged();
      }

      function trackUnavailable(handle: any) {
        unavailableDocs.set(handle.documentId, handle.url);
        schedulePeriodicRetry();
      }

      repo.on("document", ({ handle }: { handle: any }) => {
        if (handle.state === "unavailable") {
          trackUnavailable(handle);
        } else {
          handle.whenReady(["ready", "unavailable"]).then(() => {
            if (handle.state === "unavailable") {
              trackUnavailable(handle);
            }
          }).catch(() => {});
        }
      });

      // When keyhive events are ingested, retry unavailable documents
      let ingestRetryTimer: ReturnType<typeof setTimeout> | null = null;
      let lastIngestRetryRun = 0;
      const INGEST_RETRY_DEBOUNCE_MS = 500;
      const INGEST_RETRY_MAX_DELAY_MS = 1000;

      function debouncedRetryUnavailableDocs() {
        const now = Date.now();
        const elapsed = now - lastIngestRetryRun;

        if (elapsed >= INGEST_RETRY_MAX_DELAY_MS) {
          if (ingestRetryTimer !== null) {
            clearTimeout(ingestRetryTimer);
            ingestRetryTimer = null;
          }
          lastIngestRetryRun = now;
          retryUnavailableDocs();
          return;
        }

        if (ingestRetryTimer !== null) {
          clearTimeout(ingestRetryTimer);
        }
        const delay = Math.min(INGEST_RETRY_DEBOUNCE_MS, INGEST_RETRY_MAX_DELAY_MS - elapsed);
        ingestRetryTimer = setTimeout(() => {
          ingestRetryTimer = null;
          lastIngestRetryRun = Date.now();
          retryUnavailableDocs();
        }, delay);
      }

      (hive.networkAdapter as any).on("ingest-remote", debouncedRetryUnavailableDocs);

      // Reset retry budget when a peer connects
      hive.networkAdapter.on("peer-candidate", () => {
        if (unavailableDocs.size > 0) {
          periodicRetryCount = 0;
          retryUnavailableDocs();
          schedulePeriodicRetry();
        }
      });

      // Periodic retry for non-keyhive docs
      const PERIODIC_RETRY_INTERVAL_MS = 1000;
      const MAX_PERIODIC_RETRIES = 60;
      let periodicRetryCount = 0;
      let periodicRetryScheduled = false;

      function schedulePeriodicRetry() {
        if (periodicRetryScheduled) return;
        if (periodicRetryCount >= MAX_PERIODIC_RETRIES) {
          if (unavailableDocs.size > 0) {
            console.warn(`[service worker] max retries reached, ${unavailableDocs.size} docs still unavailable`);
          }
          return;
        }
        if (unavailableDocs.size === 0) return;
        periodicRetryScheduled = true;
        setTimeout(() => {
          periodicRetryScheduled = false;
          periodicRetryCount++;
          retryUnavailableDocs();
          schedulePeriodicRetry();
        }, PERIODIC_RETRY_INTERVAL_MS);
      }

      // Trigger immediate keyhive sync on startup
      hive.networkAdapter.whenReady().then(() => {
        (hive.networkAdapter as any).syncKeyhive();
      });

      return { hive, repo, unavailableDocs, schedulePeriodicRetry };
    })();
  }
  return repoHivePromise;
}

async function getRepo() {
  const { repo } = await getRepoHive();
  return repo;
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

  // Wait for the Subduction WebSocket to be connected before calling
  // repo.find() on remote-only docs. Without this, DocumentQuery
  // transitions to "unavailable" immediately because no peers are
  // connected yet.
  await repo.networkSubsystem.whenReady();
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

      // Collect promises so we can wait for all folder docs to resolve.
      const folderDocPromises: Promise<void>[] = [];

      // Read whatever modules are already present (may be empty on first load).
      const prefetchModules = (doc: ModuleSettingsDoc | undefined) => {
        const modules = doc?.modules ?? [];
        for (const modUrl of modules) {
          if (!modUrl || seenModules.has(modUrl)) continue;
          if (!isValidAutomergeUrl(modUrl)) continue;
          seenModules.add(modUrl);
          // Wait for each folder doc to actually resolve from Subduction.
          // When it arrives, prefetch its file sub-docs too.
          const p = repo
            .find<FolderDoc>(modUrl)
            .then((folderHandle: any) => {
              prefetchFileDocs(folderHandle.doc());
              folderHandle.on("change", () => {
                prefetchFileDocs(folderHandle.doc());
              });
            })
            .catch(() => {});
          folderDocPromises.push(p);
        }
      };

      // Prefetch whatever's available immediately.
      prefetchModules(handle.doc());

      // Also watch for the settings doc to sync — on first load the
      // modules[] array arrives incrementally.
      handle.on("change", () => {
        prefetchModules(handle.doc());
      });

      // Wait for folder docs to sync from Subduction, with a timeout.
      // Without this, the fetch handler receives requests before the SW
      // has the folder docs, causing hangs. The timeout prevents blocking
      // forever if some docs never sync.
      if (folderDocPromises.length > 0) {
        const PREFETCH_TIMEOUT_MS = 15_000;
        const timeout = new Promise<void>((resolve) =>
          setTimeout(resolve, PREFETCH_TIMEOUT_MS)
        );
        // Race each promise against the timeout individually so we don't
        // wait the full timeout if most resolve quickly.
        const timedPromises = folderDocPromises.map((p) =>
          Promise.race([
            p.then(() => "ok" as const),
            timeout.then(() => "timeout" as const),
          ])
        );
        const results = await Promise.all(timedPromises);
        const ok = results.filter((r) => r === "ok").length;
        const timedOut = results.filter((r) => r === "timeout").length;
        logger.info(
          `prefetch: ${ok}/${folderDocPromises.length} tool folder docs ready` +
            (timedOut > 0 ? ` (${timedOut} timed out)` : "")
        );
      }
    } catch (err: unknown) {
      logger.warn(`prefetch: failed for ${url}`, err);
    }
  }
}

// Connect client MessagePorts to the repo via keyhive
async function connectPort(port: MessagePort) {
  const { hive, repo, unavailableDocs, schedulePeriodicRetry } = await getRepoHive();
  const networkAdapter = new MessageChannelNetworkAdapter(port, { useWeakRef: true });
  // Tab connections don't use the hardcoded server peer ID filter
  const onlyShareWithHardcodedServerPeerId = false;
  // Tabs will request keyhive sync periodically
  const periodicallyRequestKeyhiveSync = false;
  const keyhiveNetworkAdapter = hive.createKeyhiveNetworkAdapter(networkAdapter, onlyShareWithHardcodedServerPeerId, periodicallyRequestKeyhiveSync, 2000);

  // When a tab asks for a doc we don't have, request it from the sync server
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

  // When keyhive events arrive from the tab (e.g. new doc access records
  // from create2()), sync them to the server and retry failed subduction syncs.
  keyhiveNetworkAdapter.on("ingest-remote", () => {
    (hive.networkAdapter as any).syncKeyhive?.();
    repo.shareConfigChanged();
  });

  repo.networkSubsystem.addNetworkAdapter(keyhiveNetworkAdapter);
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
    const site: string = event.data.siteName ?? "tiny-patchwork";
    subductionEndpoints = urls;
    siteName = site;
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
 * Wait for a DocumentProgress to reach the "ready" state, returning the
 * DocHandle. Unlike `whenReady()`, this tolerates the doc being temporarily
 * "unavailable" — it subscribes and waits for a transition to "ready" until
 * the timeout expires.
 */
function waitForHandle<T>(
  progress: DocumentProgress<T>,
  documentId: string,
  timeoutMs: number,
): Promise<DocHandle<T>> {
  const state = progress.peek();
  if (state.state === "ready") return Promise.resolve(state.handle);

  return new Promise<DocHandle<T>>((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      const current = progress.peek();
      if (current.state === "ready") {
        resolve(current.handle);
      } else {
        reject(new Error(`Document ${documentId} timed out (state=${current.state})`));
      }
    }, timeoutMs);

    const unsubscribe = progress.subscribe((state) => {
      if (state.state === "ready") {
        clearTimeout(timer);
        unsubscribe();
        resolve(state.handle);
      }
    });
  });
}

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

  // Wait for the folder doc to become ready. Use findWithProgress instead
  // of repo.find because find() calls whenReady() which permanently rejects
  // if the doc is initially unavailable. In the multi-hop relay architecture
  // (tab → SW → server → upstream), the SW's SubductionSource may initially
  // get 0 data from the server, marking the doc unavailable. Periodic sync
  // (30s) will eventually pick up the data once the server fetches from
  // upstream. We need to wait for that rather than fail immediately.
  const progress = repo.findWithProgress<FolderDoc>(
    maybeAutomergeUrl as import("@automerge/automerge-repo/slim").AutomergeUrl
  );
  const folderHandle = await waitForHandle(progress, documentId, ENTRY_WAIT_TIMEOUT_MS);
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
    fileHandle = await findHandleInFolderHandle(
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
    const pkgFileHandle = await findHandleInFolderHandle(
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
            fileHandle = await findHandleInFolderHandle(
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
