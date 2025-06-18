/* eslint-env serviceworker, worker */
/// <reference lib="webworker" />

/** @type {ServiceWorkerGlobalScope} */
self;

// @ts-check
import * as Automerge from "@automerge/automerge/slim";
import { automergeWasmBase64 } from "@automerge/automerge/automerge.wasm.base64";
import { Repo, isValidAutomergeUrl } from "@automerge/automerge-repo/slim";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";

/**
 * This file is not built using the standard Vite toolchain, it is built by the
 * build-service-worker.js script which is invoked by `yarn run build`. In
 * order to provide a good development experience there is also a vite plugin
 * which builds the file using esbuild in development configured in
 * vite.config.ts.
 *
 * Why?! You exclaim in horror. The problem is that Firefox does not support
 * ES modules in service workers, but Vite doesn't give us any way of using a
 * different build in service-worker.js to elsewhere. Hence, this hack, which
 * allows us to specify an IIFE output for just service-worker.js.
 *
 * Now, this means that we can't use a bunch of useful vite functionality, most
 * importantly we can't use the `?url` suffix on an import. This is a shame
 * because due to the fact that we can't use ES modules here, we need some way
 * of getting the URL to the `.wasm` file which we use to initialize Automerge.
 * As a workaround, we wait for the host page to send us a message with the URL
 * for the wasm blob in it.
 */

// The CACHE_VERSION token gets replaced during build by cache-Date.now()
// See build-service-worker.js
/* global CACHE_VERSION */
const CACHE_NAME = CACHE_VERSION;

// We also cache any JSPM.io requests because that's where our importMap
// packages live
const JSPM_ORIGIN = "https://ga.jspm.io";

let PEER_ID = `patchwork-service-worker-${Math.round(Math.random() * 1000000)}`;

// A simple counter to uniquely identify each fetch we handle. Useful when many overlap.
self.__fetchCounter = 0;
self.__activeFetches = 0;

// Debug logging control - disabled by default
let debugEnabled = false;

// ---------------------------------------------------------------------------
// Debug logging helper – prepends ISO timestamp and peer id to every log entry
// ---------------------------------------------------------------------------
const debugLog = (...args) => {
  if (!debugEnabled) return;
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`${ts} [${PEER_ID}]`, ...args);
};

const resolvablePromise = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};

let repo = null;
const { promise: repoReady, resolve: resolveRepoReady } = resolvablePromise();
// Initialize the repo
(async () => {
  debugLog("Initializing Automerge WASM");
  await Automerge.initializeBase64Wasm(automergeWasmBase64);
  debugLog("Automerge WASM initialized");

  const newRepo = new Repo({
    storage: new IndexedDBStorageAdapter(),
    network: [new BrowserWebSocketClientAdapter("wss://sync3.automerge.org")],
    peerId: PEER_ID,
    sharePolicy: async (peerId) => peerId.includes("storage-server"),
    enableRemoteHeadsGossiping: true,
  });

  // Put the repo on the global context for interactive use
  self.repo = newRepo;
  self.Automerge = Automerge;

  repo = newRepo;
  debugLog("Repo created", { peerId: PEER_ID });
  resolveRepoReady(newRepo);
})();

function sendMessageToClients(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(message);
    });
  });
}

// When the service worker restarts, tell all clients to re-establish the message channel
sendMessageToClients({ type: "SERVICE_WORKER_RESTARTED" });

self.addEventListener("install", () => {
  /* We skip waiting which means the service worker immediately takes over once it's installed
   * Any existing tab that is connected to a previous worker gets sent an "controllerchange" event to switch over to the new service worker
   */
  debugLog("Install event – skipping waiting");
  self.skipWaiting();
});

self.addEventListener("message", async (event) => {
  debugLog("Message received from client", event.data);

  switch (event.data.type) {
    case "PING":
      // don't do anything, message is only needed to keep service worker running
      debugLog("Received PING from client");
      return;

    case "DEBUG":
      // toggle debug logging
      debugEnabled = !debugEnabled;
      console.log(`Debug logging ${debugEnabled ? "ENABLED" : "DISABLED"}`);
      // Send response back to client with current state
      event.source.postMessage({
        type: "DEBUG_STATUS",
        enabled: debugEnabled,
      });
      return;

    case "GET_DEBUG_STATUS":
      // query current debug logging state
      event.source.postMessage({
        type: "DEBUG_STATUS",
        enabled: debugEnabled,
      });
      return;

    case "INIT":
      // load config and connect with client through message channel
      // if config is already loaded the new config is ignored
      debugLog("INIT message");
      if (!repo) await repoReady;
      debugLog("Repo ready – adding MessageChannel network adapter");
      repo.networkSubsystem.addNetworkAdapter(
        new MessageChannelNetworkAdapter(event.ports[0], { useWeakRef: true })
      );
      return;

    case "ADD_SYNC_SERVER":
      debugLog("ADD_SYNC_SERVER message", event.data.url);
      addSyncServer(event.data.url);
      return;

    case "MARK":
      // manual marker injected from client console for timeline correlation
      debugLog(`MARK: ${event.data.label || "(no label)"}`, {
        atClient: event.data.when,
      });
      return;
  }
});

async function addSyncServer(url) {
  debugLog("Adding sync server", url);
  if (!repo) {
    await repoReady;
  }
  repo.networkSubsystem.addNetworkAdapter(
    new BrowserWebSocketClientAdapter(url)
  );
}
// add this to window so it can be called from the service worker's REPL
self.addSyncServer = addSyncServer;

async function clearOldCaches() {
  const cacheWhitelist = [CACHE_NAME];
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames.map((cacheName) => {
    if (!cacheWhitelist.includes(cacheName)) {
      return caches.delete(cacheName);
    }
  });
  await Promise.all(deletePromises);
}

self.addEventListener("activate", async (event) => {
  debugLog("Activate event – clearing old caches and claiming clients");
  await clearOldCaches();
  debugLog("Activate event – caches cleared. Claiming clients");
  clients.claim();
});

const AUTOMERGE_REQUEST_URL_REGEX =
  /^https?:\/\/[^/]*\/automerge\/(automerge:)?([a-zA-Z0-9]+)(\/.*)?(\?.*)?$/;

const headsEqual = (doc, heads) => {
  if (!doc) {
    return false;
  }
  const docHeads = Automerge.getHeads(doc);
  return heads.every((head) => docHeads.includes(head));
};

self.addEventListener("fetch", async (event) => {
  const url = new URL(event.request.url);

  const fetchId = ++self.__fetchCounter;
  self.__activeFetches++;
  if (self.__activeFetches % 10 === 0) {
    debugLog(`ACTIVE_FETCHES: ${self.__activeFetches}`);
  }
  const fetchStart = performance.now();
  const finish = (phase, response) => {
    self.__activeFetches--;
    const elapsed = (performance.now() - fetchStart).toFixed(1);
    debugLog(`FETCH_${fetchId} ${phase} – completed in ${elapsed} ms`, {
      status: response?.status,
      url: url.href,
    });
    return response;
  };

  debugLog("Fetch intercepted", {
    url: url.href,
    method: event.request.method,
    id: fetchId,
  });

  if (AUTOMERGE_REQUEST_URL_REGEX.test(event.request.url)) {
    debugLog("AUTOMERGE request matched", url.href);
    const [, , maybeAutomergeUrl, ...encodedParts] = url.pathname.split("/");
    const parts = encodedParts.map((part) => decodeURIComponent(part));

    // support old docID style URLs
    const automergeUrl = maybeAutomergeUrl.startsWith("automerge:")
      ? maybeAutomergeUrl
      : `automerge:${maybeAutomergeUrl}`;

    debugLog("Resolved automergeUrl", automergeUrl, "parts", parts);

    if (!isValidAutomergeUrl(automergeUrl)) {
      debugLog("Invalid automergeUrl", automergeUrl);
      event.respondWith(
        new Response(`Invalid document id ${automergeUrl}`, {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        })
      );
      return;
    }

    event.respondWith(
      (async () => {
        debugLog("Handling automerge fetch for", automergeUrl);
        if (!repo) await repoReady;
        debugLog("Repo ready – calling repo.find");

        const findStart = performance.now();
        const handle = await repo.find(automergeUrl);
        debugLog("Repo.find finished", {
          id: fetchId,
          duration: (performance.now() - findStart).toFixed(1),
          state: handle.state,
        });
        debugLog("Handle obtained", { state: handle.state });
        let doc = handle.doc();
        debugLog("Initial doc present", !!doc);

        if (!doc) {
          debugLog("Document unavailable – returning 500");
          return new Response(
            `Document unavailable.\n${automergeUrl}: ${handle.state}`,
            {
              status: 500,
              headers: { "Content-Type": "text/plain" },
            }
          );
        }

        // If the request asked for a specific heads on the document,
        // try waiting to see if the document arrives at that heads.
        // (NOTE: this is overly simplistic because it requires an exact match
        // between the requested heads and the current doc on the service worker;
        // we probably want something more sophisticated like waiting until the SW
        // has a superset of the requested heads and then can return a view at the
        // requested heads? However, for the simple case of a client tab coordinating
        // with the service worker, this seems to be enough for now.)

        // Try every INTERVAL_MS for TIMEOUT_MS
        const INTERVAL_MS = 16;
        const TIMEOUT_MS = 2000;
        const startTime = Date.now();

        const queryHeads = url.searchParams.get("heads")?.split(",");
        debugLog("Requested heads", queryHeads);

        if (queryHeads?.length > 0) {
          debugLog("Waiting for heads to match...");
          while (
            !headsEqual(doc, queryHeads) &&
            Date.now() - startTime < TIMEOUT_MS
          ) {
            await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
            doc = handle.doc();
          }

          if (!headsEqual(doc, queryHeads)) {
            debugLog("Heads mismatch after waiting", {
              requested: queryHeads,
              current: Automerge.getHeads(doc),
            });
            return finish(
              "heads-mismatch",
              new Response(
                `Heads mismatch: requested ${queryHeads} but had ${Automerge.getHeads(
                  doc
                )}`,
                {
                  status: 404,
                  headers: { "Content-Type": "text/plain" },
                }
              )
            );
          } else {
            debugLog("Heads matched", Automerge.getHeads(doc));
          }
        }

        debugLog("Resolving file path parts", parts);
        let file;

        if (doc.docs) {
          file = await parts.reduce(async (acc, curr) => {
            let target = (await acc)?.docs?.find((doc) => doc.name === curr);

            if (isValidAutomergeUrl(target?.url)) {
              target = (await repo.find(target.url)).doc();
            }
            return target;
          }, doc);
        } else {
          file = await parts.reduce(async (acc, curr) => {
            let target = (await acc)?.[curr];
            if (isValidAutomergeUrl(target)) {
              target = (await repo.find(target)).doc();
            }
            return target;
          }, doc);
        }

        if (!file) {
          debugLog("File not found for path", url.pathname);
          return finish(
            "file-not-found",
            new Response(
              `Not found\nObject path: ${url.pathname}\n${JSON.stringify(
                doc,
                null,
                2
              )}`,
              {
                status: 404,
                headers: { "Content-Type": "text/plain" },
              }
            )
          );
        }

        debugLog("File resolved", { mimeType: file.mimeType });

        let dataToReturn = file.content;

        // This is backwards compatibility—file.content used to be an object,
        // so we still handle old files that have that shape.
        const isOldFormat =
          typeof file.content === "object" && file.content.value !== undefined;
        if (isOldFormat) {
          debugLog("Old file format detected – using nested value");
          dataToReturn = file.content.value;
        }

        if (!file.mimeType) {
          debugLog("File entry missing mimeType – invalid entry");
          // Detect old file format
          if (file?.content?.value) {
            return new Response(
              "The requested file uses a deprecated storage format (from before 1/14/25) and can't be loaded. You can re-push from Jacquard or open it in the editor to migrate it to the new format.",
              {
                status: 500,
                headers: { "Content-Type": "text/plain" },
              }
            );
          }

          return new Response(
            `Invalid file entry.\n${url.pathname}:\nfileEntry:${JSON.stringify(
              file
            )}`,
            {
              status: 404,
              headers: { "Content-Type": "text/plain" },
            }
          );
        }

        debugLog("Responding with file content", {
          size:
            typeof dataToReturn === "string"
              ? dataToReturn.length
              : dataToReturn?.byteLength || 0,
        });

        return finish(
          "success",
          new Response(dataToReturn, {
            headers: { "Content-Type": file.mimeType },
          })
        );
      })()
    );
  } else if (
    event.request.method === "GET" &&
    (url.origin === self.location.origin || url.origin === JSPM_ORIGIN)
  ) {
    debugLog("Static or JSPM fetch – attempting cache", url.href);
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        // We use a network-first strategy for the root index.html to avoid references to stale asset files.
        // The problem this solves: when we rebuild the app, we get new JS asset filenames. But the old
        // index.html still has references to the old asset filenames. If the service worker serves the old
        // index.html, the browser will try to fetch the old asset files which 404.
        // So, to avoid that, we always check the network first for the root index.html.
        // For all the other asset files we can stick with a cache-first approach, which is faster.
        if (url.pathname === "/") {
          debugLog("HTML request – trying network first", url.href);
          try {
            const networkResponse = await fetch(event.request);
            debugLog("Network response status", networkResponse.status);
            if (
              200 <= networkResponse.status &&
              networkResponse.status <= 299
            ) {
              // Cache successful responses
              cache.put(event.request, networkResponse.clone());
              debugLog("Network success – HTML cached");
              return finish("network", networkResponse);
            }
          } catch (error) {
            debugLog(
              "Network failed for HTML – falling back to cache",
              error.message
            );
          }

          // Fallback to cache if network fails
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            debugLog("Cache fallback hit for HTML", url.href);
            return finish("cache-fallback", cachedResponse);
          }

          // If both network and cache fail, return error
          return finish(
            "html-unavailable",
            new Response("HTML unavailable", { status: 503 })
          );
        }

        // For most assets, use cache-first strategy
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          debugLog("Cache hit", url.href);
          return finish("cache-hit", cachedResponse);
        }

        debugLog("Cache miss – fetching from network", url.href);

        // On cache fail, hit the network
        const networkResponse = await fetch(event.request);
        debugLog("Network response status", networkResponse.status);
        if (200 <= networkResponse.status && networkResponse.status <= 299) {
          // only cache successes
          cache.put(event.request, networkResponse.clone());
          debugLog("Network success – response cached");
        }
        return finish("network", networkResponse);
      })()
    );
  }
});
