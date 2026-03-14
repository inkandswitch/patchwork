/// <reference types="service-worker-types" />

import { automergeWasmBase64 } from "@automerge/automerge/automerge.wasm.base64";
import { initializeBase64Wasm } from "@automerge/automerge/slim";
import {
  Repo,
  IndexedDBStorageAdapter,
  WebSocketClientAdapter,
  MessageChannelNetworkAdapter,
  isValidAutomergeUrl,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  type AutomergeUrl,
  type PeerId,
  type StorageId,
} from "@automerge/vanillajs/slim";

let cachename = "default";
let debugging = false;

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
    repoPromise = initializeBase64Wasm(automergeWasmBase64).then(async () => {
      const repo = new Repo({
        storage: new IndexedDBStorageAdapter(),
        network: [new WebSocketClientAdapter("wss://sync3.automerge.org")],
        peerId: ("service-worker-" +
          (Math.random() * 10000).toString(36).slice(2)) as PeerId,
        async sharePolicy(peerId) {
          return peerId.includes("storage-server");
        },
        enableRemoteHeadsGossiping: true,
      });

      (self as any).repo = repo;
      console.log(
        "[service worker] repo initialized, waiting for network subsystem to be ready"
      );
      await repo.networkSubsystem.whenReady();
      console.log("[service worker] repo network subsystem ready");

      return repo;
    });
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
  }
});

// Filesystem types (inlined to avoid cross-package dependency)
interface FolderDoc {
  title: string;
  docs: Array<{ name: string; url: string }>;
}

interface FileDoc {
  content: string | Uint8Array;
  mimeType?: string;
}

async function resolveAutomergeUrl(handoffURL: URL): Promise<Response> {
  const repo = await getRepo();
  const href = handoffURL.href;
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
    return new Response(null, {
      status: 307,
      headers: { location },
    });
  }

  // Navigate folder structure to find the file
  let current = await repo.find<FolderDoc>(maybeAutomergeUrl);

  for (const part of path.map(decodeURIComponent)) {
    const doc = current.doc();
    if (!doc?.docs) {
      throw new Error(
        `folder at ${current.url} has no docs array (resolving ${path.join("/")})`
      );
    }
    const target = doc.docs.find(
      (link: { name: string; url: string }) => link.name === part
    );
    if (!target?.url) {
      throw new Error(
        `couldn't find ${part} in folder at ${current.url} (resolving ${path.join("/")})`
      );
    }
    current = await repo.find(target.url as AutomergeUrl);
  }

  const fileDoc = current.doc() as unknown as FileDoc;
  const content = fileDoc?.content;
  if (!content) {
    throw new Error(`file at ${href} has no content`);
  }

  const body: BodyInit =
    content instanceof Uint8Array
      ? (new Uint8Array(content) as BlobPart)
      : String(content);
  const mimeType = fileDoc.mimeType ?? "text/plain";

  const headers = new Headers({ "content-type": mimeType });
  headers.set("cross-origin-embedder-policy", "credentialless");
  headers.set("cross-origin-resource-policy", "cross-origin");

  return new Response(body, { status: 200, headers });
}

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
      // trap any request like /url e.g. /automerge%3Awhatever or /http%3A%2F%2Fsomething.com
      // URI encoded so we can include hashes etc
      handoffURL = new URL(decodeURIComponent(url.pathname.slice(1)));
      log(`received handoff request ${handoffURL}`);
    } catch {}
  }

  fetchEvent.respondWith(
    (async () => {
      const cache = await caches.open(cachename);
      const match = await cache.match(request);

      try {
        if (handoffURL) {
          // cache-first strategy for automerge requests

          if (match) {
            log(`serving ${handoffURL} from cache ${cachename}`);
            const headers = new Headers(match.headers);
            headers.set("cross-origin-embedder-policy", "credentialless");
            headers.set("cross-origin-resource-policy", "cross-origin");
            return new Response(match.body, {
              status: match.status,
              headers,
            });
          }

          const response = await resolveAutomergeUrl(handoffURL);

          if (response.status === 307) {
            // don't cache redirects
            return response;
          }

          if (cacheableStatuses.includes(response.status)) {
            log(`caching ${handoffURL}`);
            await cache.put(request, response.clone());
          }

          return response;
        } else {
          // network first strategy for external requests
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
          `service worker error resolving ${request.url}${handoffURL ? ` (handoff: ${handoffURL})` : ""}.\n${message}`
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
