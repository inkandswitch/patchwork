/* eslint-env serviceworker, worker */
/// <reference lib="webworker" />

/** @type {ServiceWorkerGlobalScope} */
self;

// @ts-check
import * as Automerge from "@automerge/automerge/slim";
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

const resolvablePromise = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};

/* Config is passed by the client in the init message
{
  wasmBlobUrl: string  // url to the wasm blob
  peerIdPrefix: string // prefix that is added to peer to make it easier to find own messages in server log
}*/
let setConfig;
const config = new Promise((resolve) => {
  setConfig = resolve;
});

let repo = null;
const { promise: repoReady, resolve: resolveRepoReady } = resolvablePromise();
// Initialize the repo
(async () => {
  const { wasmBlobUrl, peerIdPrefix } = await config;
  await Automerge.initializeWasm(wasmBlobUrl);

  if (peerIdPrefix) {
    PEER_ID = `${peerIdPrefix}-${PEER_ID}`;
  }

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
  self.skipWaiting();
});

self.addEventListener("message", async (event) => {
  // console.log(`${PEER_ID}: Client messaged`, event.data);

  switch (event.data.type) {
    case "PING":
      // don't do anything, message is only needed to keep service worker running
      return;

    case "INIT":
      // load config and connect with client through message channel
      // if config is already loaded the new config is ignored
      setConfig(event.data.config);
      if (!repo) await repoReady;
      repo.networkSubsystem.addNetworkAdapter(
        new MessageChannelNetworkAdapter(event.ports[0], { useWeakRef: true })
      );
      return;

    case "ADD_SYNC_SERVER":
      addSyncServer(event.data.url);
      return;
  }
});

async function addSyncServer(url) {
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
  console.log(`${PEER_ID}: Activating service worker.`);
  await clearOldCaches();
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

  if (AUTOMERGE_REQUEST_URL_REGEX.test(event.request.url)) {
    const [, , maybeAutomergeUrl, ...encodedParts] = url.pathname.split("/");
    const parts = encodedParts.map((part) => decodeURIComponent(part));

    // support old docID style URLs
    const automergeUrl = maybeAutomergeUrl.startsWith("automerge:")
      ? maybeAutomergeUrl
      : `automerge:${maybeAutomergeUrl}`;

    if (!isValidAutomergeUrl(automergeUrl)) {
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
        if (!repo) await repoReady;

        const handle = await repo.find(automergeUrl);
        let doc = handle.doc();

        if (!doc) {
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
        if (queryHeads?.length > 0) {
          while (
            !headsEqual(doc, queryHeads) &&
            Date.now() - startTime < TIMEOUT_MS
          ) {
            await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
            doc = handle.doc();
          }

          if (!headsEqual(doc, queryHeads)) {
            return new Response(
              `Heads mismatch: requested ${queryHeads} but had ${Automerge.getHeads(
                doc
              )}`,
              {
                status: 404,
                headers: { "Content-Type": "text/plain" },
              }
            );
          }
        }

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
          return new Response(
            `Not found\nObject path: ${url.pathname}\n${JSON.stringify(
              doc,
              null,
              2
            )}`,
            {
              status: 404,
              headers: { "Content-Type": "text/plain" },
            }
          );
        }

        let dataToReturn = file.content;

        // This is backwards compatibility—file.content used to be an object,
        // so we still handle old files that have that shape.
        const isOldFormat =
          typeof file.content === "object" && file.content.value !== undefined;
        if (isOldFormat) {
          dataToReturn = file.content.value;
        }

        if (!file.mimeType) {
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

        return new Response(dataToReturn, {
          headers: { "Content-Type": file.mimeType },
        });
      })()
    );
  } else if (
    event.request.method === "GET" &&
    (url.origin === self.location.origin || url.origin === JSPM_ORIGIN)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        // Try cache first -- this site is all static
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // On cache fail, hit the network
        const networkResponse = await fetch(event.request);
        if (200 <= networkResponse.status && networkResponse.status <= 299) {
          // only cache successes
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      })()
    );
  }
});
