/// <reference types="service-worker-types" />

// @ts-check
import * as Automerge from "@automerge/automerge/slim";
import { automergeWasmBase64 } from "@automerge/automerge/automerge.wasm.base64";
import {
  Repo,
  isValidAutomergeUrl,
  IndexedDBStorageAdapter,
  WebSocketClientAdapter,
  MessageChannelNetworkAdapter,
  PeerId,
  AutomergeUrl,
  type SharePolicy,
} from "@automerge/vanillajs/slim";
import * as resolve from "resolve.exports";

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
declare global {
  // The CACHE_VERSION token gets replaced during build by cache-Date.now()
  var __CACHE_VERSION__: string;
  // created during build
  var __SYNC_SERVER_URL__: string;
  // created during build
  var __KEYHIVE_ENABLED__: boolean;
}

const CACHE_NAME = __CACHE_VERSION__;

// We also cache these common module hosts
const CACHED_ORIGINS = ["https://ga.jspm.io", "https://esm.sh"];

// A simple counter to uniquely identify each fetch we handle. Useful when many overlap.
let __fetchCounter = 0;
let __activeFetches = 0;
declare global {
  var repo: Repo;
  var Automerge: typeof import("@automerge/automerge");
}

declare global {
  interface Window {
    Automerge: typeof import("@automerge/automerge");
    repo: import("@automerge/vanillaJS").Repo;
  }
}

// Debug logging control - disabled by default
let debugEnabled = false;

// ---------------------------------------------------------------------------
// Debug logging helper – prepends ISO timestamp and peer id to every log entry
// ---------------------------------------------------------------------------
const debugLog = (...args: any) => {
  if (!debugEnabled) return;
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`${ts}`, ...args);
};

let repo = null as Repo | null;
const { promise: repoReady, resolve: resolveRepoReady } =
  Promise.withResolvers<Repo>();

function sendMessageToClients(message: any) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(message);
    });
  });
}

(async () => {
  debugLog("Initializing Automerge WASM");
  await Automerge.initializeBase64Wasm(automergeWasmBase64);
  debugLog("Automerge WASM initialized");
  const peerIdSuffix =
    Math.random().toString(36).substring(2, 15) + "-service-worker";
  const storage = new IndexedDBStorageAdapter();

  const identity = await (async function () {
    if (!__KEYHIVE_ENABLED__) return;

    const keyhive = await import("@keyhive/keyhive/slim");

    const { wasmBase64 } = await import(
      // @ts-expect-error
      "@keyhive/keyhive/keyhive_wasm.base64.js"
    );
    const { initializeKeyhive } = await import("@patchwork/identity");

    keyhive.initFromBase64Wasm(wasmBase64);
    keyhive.setPanicHook();
    return await initializeKeyhive({
      storage,
      peerIdSuffix,
      eventHandler(event) {
        console.log("[Keyhive Event]", event);
      },
    });
  })();

  const ws = new WebSocketClientAdapter(__SYNC_SERVER_URL__);
  const KeyhiveNetworkAdapter =
    identity &&
    (await import("@automerge/automerge-keyhive-network-adapter"))
      .KeyhiveNetworkAdapter;

  const network = identity
    ? [
        new KeyhiveNetworkAdapter!(
          ws,
          identity.keyhive,
          storage,
          identity.syncServer.peerId
        ),
      ]
    : [ws];

  const serviceWorkerPeerId = identity
    ? identity.peerId
    : (`patchwork-service-worker-${peerIdSuffix}` as PeerId);

  const sharePolicy: SharePolicy = identity
    ? async (peerId) => peerId === identity.syncServer.peerId
    : async (peerId) => peerId.includes("storage-server");

  const newRepo = new Repo({
    storage,
    network,
    peerId: serviceWorkerPeerId,
    sharePolicy,
    enableRemoteHeadsGossiping: true,
  });

  repo = newRepo;

  // Put the repo on the global context for interactive use
  self.repo = repo;
  self.Automerge = Automerge;

  debugLog("Repo created", { peerId: serviceWorkerPeerId });
  resolveRepoReady(repo);
})();

// When the service worker restarts, tell all clients to re-establish the message channel
sendMessageToClients({ type: "SERVICE_WORKER_RESTARTED" });

self.addEventListener("install", () => {
  /*
   * We skip waiting which means the service worker immediately takes over once
   * it's installed. Any existing tab that is connected to a previous worker
   * gets sent an "controllerchange" event to switch over to the new service
   * worker
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
      event.source!.postMessage({
        type: "DEBUG_STATUS",
        enabled: debugEnabled,
      });
      return;

    case "GET_DEBUG_STATUS":
      // query current debug logging state
      event.source!.postMessage({
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
      repo!.networkSubsystem.addNetworkAdapter(
        new MessageChannelNetworkAdapter(event.ports[0], { useWeakRef: true })
      );
      // Notify client that service worker is ready
      event.source?.postMessage({ type: "SERVICE_WORKER_READY" });
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

async function addSyncServer(url: string) {
  debugLog("Adding sync server", url);
  if (!repo) {
    await repoReady;
  }
  repo!.networkSubsystem.addNetworkAdapter(new WebSocketClientAdapter(url));
}
// add this to window so it can be called from the service worker's REPL
self.addSyncServer = addSyncServer;
declare global {
  var addSyncServer: (url: string) => Promise<void>;
}

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

const headsEqual = (doc: Automerge.Doc<unknown>, heads: string[]) => {
  if (!doc) {
    return false;
  }
  const docHeads = Automerge.getHeads(doc);
  return heads.every((head) => docHeads.includes(head));
};

self.addEventListener("fetch", async (event: FetchEvent) => {
  const url = new URL(event.request.url);

  const fetchId = ++__fetchCounter;
  __activeFetches++;
  if (__activeFetches % 10 === 0) {
    debugLog(`ACTIVE_FETCHES: ${__activeFetches}`);
  }
  const fetchStart = performance.now();
  const finish = (phase: string, response: Response) => {
    __activeFetches--;
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
    // in case we end with a /
    if (parts[parts.length - 1] === "") {
      parts.pop();
    }

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
        if (!repo) await repoReady;
        const handle = await repo!.find(automergeUrl);
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

        if (queryHeads && queryHeads?.length > 0) {
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
        let file:
          | Automerge.Doc<
              { content?: any; mimeType?: string } | { docs: DocLink[] }
            >
          | undefined;

        if (parts.length == 0 && isFolder(doc)) {
          debugLog("asking for a folder");
          const entrypoint = await findEntrypointFromFolder(doc);
          if (entrypoint) {
            debugLog("found entrypoint", entrypoint);
            return finish(
              "success",
              new Response(`export * from "${url}/${entrypoint}"`, {
                headers: { "Content-Type": "application/javascript" },
              })
            );
          }
        }

        if (isFolder(doc)) {
          file = await findFileInFolder(doc, parts);
          if (file && "docs" in file) {
            debugLog("ended on a folder, looking for a main");
            const entrypoint = await findEntrypointFromFolder(
              file as { docs: DocLink[] }
            );
            if (entrypoint) {
              debugLog("found an entrypoint", entrypoint);
              return finish(
                "success",
                new Response(`export * from "${url}/${entrypoint}"`, {
                  headers: { "Content-Type": "application/javascript" },
                })
              );
            } else {
              file = undefined;
            }
          }
        } else {
          file = await parts.reduce(
            async (acc, curr) => {
              let target = (await acc)?.[curr];
              if (isValidAutomergeUrl(target)) {
                target = (await repo!.find(target)).doc();
              }
              return target;
            },
            doc as Automerge.Doc<unknown> | Promise<Automerge.Doc<unknown>>
          );
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
              "The requested file uses a deprecated storage format (from before 1/14/25) and can't be loaded. You can re-push via the CLI or open it in the editor to migrate it to the new format.",
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

        // pvh called this a war crime, but i think it's beautiful
        if (
          file.mimeType == "application/wasm" &&
          event.request.destination == "script"
        ) {
          return finish("success", await createWasmResponse(dataToReturn));
        }

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
    (url.origin === self.location.origin || CACHED_ORIGINS.includes(url.origin))
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
            // NOTE: we specifically bypass the browser cache for this network request with cache: "reload".
            // This is because some files like sdk/dist/*.js don't have hashes in their names, so the native
            // browser cache can serve old versions. Given that we are caching requests in this service worker
            // anyway, it's fine to force a load from the network here, when we know we need the latest version.
            const networkResponse = await fetch(event.request, {
              cache: "reload",
            });
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
              error instanceof Error ? error.message : error
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

        // On cache fail, hit the network.
        // NOTE: we specifically bypass the browser cache for this network request with cache: "reload".
        // This is because some files like sdk/dist/*.js don't have hashes in their names, so the native
        // browser cache can serve old versions. Given that we are caching requests in this service worker
        // anyway, it's fine to force a load from the network here, when we know we need the latest version.
        const networkResponse = await fetch(event.request, {
          cache: "reload",
        });
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

/*
 * TODO (chee: 2025-09-18) this is temporary to hack around the fact the
 * es-module-shims isn't working for loaded plugins for some reason
 */

function safeIdent(name: string) {
  const id = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)
    ? name
    : "_" + name.replace(/[^\w$]/g, "_");
  const reserved = new Set([
    "default",
    "export",
    "import",
    "var",
    "let",
    "const",
    "function",
    "class",
    "extends",
    "super",
    "return",
    "if",
    "else",
    "switch",
    "case",
    "for",
    "while",
    "do",
    "break",
    "continue",
    "try",
    "catch",
    "finally",
    "new",
    "this",
    "typeof",
    "void",
    "delete",
    "in",
    "instanceof",
    "yield",
    "await",
    "with",
    "enum",
    "implements",
    "interface",
    "package",
    "private",
    "protected",
    "public",
    "static",
  ]);
  return reserved.has(id) ? `_${id}` : id;
}

// mostly ripped from es-module-shims
async function createWasmResponse(bytes: Uint8Array<ArrayBuffer>) {
  const module = new WebAssembly.Module(bytes);
  const imports = WebAssembly.Module.imports(module);
  const exports = WebAssembly.Module.exports(module);
  const importModules = Array.from(new Set(imports.map((d) => d.module)));
  const importBindings = importModules.map((m, i) => ({
    spec: m,
    local: `impt${i}`,
  }));
  const keyvals = importBindings
    .map((b) => `${JSON.stringify(b.spec)}: ${b.local}`)
    .join(", ");
  const esmImports = importBindings
    .map((b) => `import * as ${b.local} from ${JSON.stringify(b.spec)};`)
    .join("\n");

  const names = exports
    .map(({ name }) => `export let ${safeIdent(name)};`)
    .join("\n");

  const assigns = exports
    .map(({ name, kind }) => {
      const target = safeIdent(name);
      if (kind === "global") {
        return /*js*/ `try {
          ${target} = instance.exports[${JSON.stringify(name)}].value
        } catch {
          ${target} = instance.exports[${JSON.stringify(name)}]
        }`;
      }
      return `${target} = instance.exports[${JSON.stringify(name)}]`;
    })
    .join("\n");

  const script = /* js */ `
    ${esmImports}
    ${names}
    const bytes = new Uint8Array([${Array.from(bytes)}]);
    const { instance } = await WebAssembly.instantiate(bytes, { ${keyvals} });
    ${assigns}
  `;

  return new Response(script, {
    headers: { "content-type": "application/javascript" },
  });
}

type DocLink = { name: string; url: AutomergeUrl };

// TODO(chee@2025-09-19): merge this with the similar thing in rootstock
async function findEntrypointFromFolder(doc: { docs: DocLink[] }) {
  if (!repo) await repoReady;
  const pkgUrl = doc.docs.find((doc) => doc.name === "package.json")?.url;
  if (isValidAutomergeUrl(pkgUrl)) {
    const pkgFile = (await repo!.find<{ content: string }>(pkgUrl)).doc();
    const pkg = JSON.parse(pkgFile.content);
    const mains =
      resolve.exports(pkg, ".", {
        conditions: ["patchwork", "import"],
      }) ??
      pkg.browser ??
      pkg.module ??
      pkg.main;
    if (!mains) return [];
    const main = Array.isArray(mains) ? mains[0] : mains;
    const mainParts = main.split("/");
    if (mainParts[0] == ".") {
      mainParts.shift();
    }
    return mainParts.join("/");
  }
}

async function findFileInFolder(doc: { docs: DocLink[] }, parts: string[]) {
  if (!repo) await repoReady;
  if (!parts.length) return doc;
  return parts.reduce(
    // @ts-expect-error TODO fix this some day
    async (acc, curr) => {
      let target = ((await acc) as { docs: DocLink[] })?.docs?.find(
        (doc) => doc.name === curr
      );

      if (isValidAutomergeUrl(target?.url)) {
        target = (await repo!.find<DocLink>(target?.url)).doc();
      }

      return target!;
    },
    doc
  ) as Automerge.Doc<unknown>;
}

function isFolder(
  doc: Automerge.Doc<unknown>
): doc is Automerge.Doc<{ docs: DocLink[] }> {
  return "docs" in doc;
}
