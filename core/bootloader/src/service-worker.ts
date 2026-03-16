/// <reference types="service-worker-types" />

console.log("hi from claude");

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
  type AutomergeUrl,
  type PeerId,
} from "@automerge/automerge-repo/slim";
import {
  findHandleInFolderHandle,
  resolvePackageExport,
  automergeUrlToServiceWorkerUrl,
  defaultImportConditions,
  type FolderDoc,
} from "@inkandswitch/patchwork-filesystem";

// Small adapters — bundled directly into the SW
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";

// Small — bundled directly into the SW
import { init as lexerReady, parse as parseImports } from "es-module-lexer";
import externals from "./externals.js";

// Build-time importmap: bare specifier → URL for shared/builtin packages.
// When an automerge-served JS file does `import "solid-js"`, we resolve
// it to /packages/solid-js.js without touching automerge at all.
const builtinImports: Record<string, string> = Object.fromEntries(
  externals.map((name) => [name, `/packages/${name}.js`])
);

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
    repoPromise = (async () => {
      const wasmResponse = await fetch("/automerge.wasm");
      await initializeWasm(new Uint8Array(await wasmResponse.arrayBuffer()));
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
  }
});

interface FileDoc {
  content: string | Uint8Array;
  mimeType?: string;
}

// ── Bare import rewriting ──────────────────────────────────────────────

function isBareSpecifier(specifier: string): boolean {
  return (
    specifier.length > 0 &&
    !specifier.startsWith(".") &&
    !specifier.startsWith("/") &&
    !specifier.includes(":")
  );
}

/**
 * Given a folder's automerge URL, read its package.json or importmap.json
 * and return the dependency map: { "lol": "automerge:defghi", ... }
 */
async function getDependencyMap(
  repo: Repo,
  folderUrl: AutomergeUrl
): Promise<Record<string, string> | undefined> {
  const folderHandle = await repo.find<FolderDoc>(folderUrl);

  for (const name of ["package.json", "importmap.json"]) {
    const fileHandle = await findHandleInFolderHandle<FileDoc>(
      repo,
      folderHandle,
      [name]
    );
    if (!fileHandle) continue;

    const fileDoc = fileHandle.doc() as FileDoc | undefined;
    if (!fileDoc?.content) continue;

    const json = JSON.parse(String(fileDoc.content));

    if (name === "importmap.json") {
      return json.imports;
    } else {
      return json.dependencies;
    }
  }

  return undefined;
}

/**
 * Given a dep's automerge URL and a subpath (e.g. "." or "./utils"),
 * resolve the entry point via package.json exports and return
 * the full SW-handoff URL path (e.g. /automerge%3Adefghi/dist/index.js).
 */
async function resolveDepEntryPoint(
  repo: Repo,
  depAutomergeUrl: AutomergeUrl,
  subpath: string = ".",
  conditions: string[] = defaultImportConditions
): Promise<string | undefined> {
  const folderHandle = await repo.find<FolderDoc>(depAutomergeUrl);
  const pkgFileHandle = await findHandleInFolderHandle<FileDoc>(
    repo,
    folderHandle,
    ["package.json"]
  );
  if (!pkgFileHandle) return undefined;

  const pkgFileDoc = pkgFileHandle.doc() as FileDoc | undefined;
  if (!pkgFileDoc?.content) return undefined;

  const pkgJson = JSON.parse(String(pkgFileDoc.content));

  let entryPoint: string | undefined;
  try {
    entryPoint = resolvePackageExport(pkgJson, subpath, conditions);
  } catch {}

  if (!entryPoint) return undefined;

  // Build the SW-handoff URL: /automerge%3A.../dist/index.js
  const base = automergeUrlToServiceWorkerUrl(depAutomergeUrl);
  const resolved = new URL(entryPoint, new URL(base, "http://x")).pathname;
  return resolved;
}

/**
 * Rewrite bare import specifiers in JS source to resolved URLs.
 * Checks builtins first (/packages/...), then the folder's dependency map.
 */
async function rewriteBareImports(
  source: string,
  rootAutomergeUrl: AutomergeUrl,
  repo: Repo
): Promise<string> {
  await lexerReady;
  const [imports] = parseImports(source);

  if (!imports.length) return source;

  // Collect bare specifiers
  const bareSpecifiers = new Set<string>();
  for (const imp of imports) {
    if (imp.n && isBareSpecifier(imp.n)) {
      bareSpecifiers.add(imp.n);
    }
  }

  if (!bareSpecifiers.size) return source;

  // Fetch the dependency map from the root folder
  const deps = await getDependencyMap(repo, rootAutomergeUrl);

  // Build a resolution map: bare specifier → resolved URL
  const resolutions = new Map<string, string>();
  for (const specifier of bareSpecifiers) {
    // 1. Check builtins first (solid-js, @automerge/automerge, etc.)
    if (builtinImports[specifier]) {
      resolutions.set(specifier, builtinImports[specifier]);
      continue;
    }

    if (!deps) continue;

    // 2. Split "lol/utils" into package name "lol" and subpath "./utils"
    const firstSlash = specifier.indexOf("/");
    const isScoped = specifier.startsWith("@");
    let pkgName: string;
    let subpath: string;

    if (isScoped) {
      const secondSlash = specifier.indexOf("/", firstSlash + 1);
      if (secondSlash === -1) {
        pkgName = specifier;
        subpath = ".";
      } else {
        pkgName = specifier.slice(0, secondSlash);
        subpath = "./" + specifier.slice(secondSlash + 1);
      }
    } else if (firstSlash === -1) {
      pkgName = specifier;
      subpath = ".";
    } else {
      pkgName = specifier.slice(0, firstSlash);
      subpath = "./" + specifier.slice(firstSlash + 1);
    }

    const depValue = deps[pkgName];
    if (!depValue) continue;

    if (isValidAutomergeUrl(depValue)) {
      const entryUrl = await resolveDepEntryPoint(
        repo,
        depValue,
        subpath
      );
      if (entryUrl) {
        resolutions.set(specifier, entryUrl);
      }
    }
  }

  if (!resolutions.size) return source;

  // Rewrite the source string, working backwards to preserve offsets
  let result = source;
  const sorted = [...imports]
    .filter((imp) => imp.n && resolutions.has(imp.n))
    .sort((a, b) => b.s - a.s);

  for (const imp of sorted) {
    const resolved = resolutions.get(imp.n!);
    if (!resolved) continue;
    result = result.slice(0, imp.s) + resolved + result.slice(imp.e);
  }

  return result;
}

// ── Automerge URL resolution ───────────────────────────────────────────

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

  // If no path, check if this is a package with exports to resolve
  // e.g. /automerge%3Adocid/abc → resolve "abc" via package.json exports
  const folderHandle = await repo.find<FolderDoc>(maybeAutomergeUrl);

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
    throw new Error(
      `couldn't resolve ${path.join("/")} in folder at ${maybeAutomergeUrl}`
    );
  }

  const fileDoc = fileHandle.doc() as unknown as FileDoc;
  const content = fileDoc?.content;
  if (!content) {
    throw new Error(`file at ${href} has no content`);
  }

  let body: BodyInit =
    content instanceof Uint8Array
      ? (new Uint8Array(content) as BlobPart)
      : String(content);
  const mimeType = fileDoc.mimeType ?? "text/plain";

  // Rewrite bare imports in JS files served from automerge folders
  const lastPart = path[path.length - 1];
  const isJS =
    mimeType === "application/javascript" ||
    mimeType === "text/javascript" ||
    lastPart?.endsWith(".js") ||
    lastPart?.endsWith(".mjs");

  if (isJS && typeof content === "string") {
    try {
      body = await rewriteBareImports(
        content,
        maybeAutomergeUrl as AutomergeUrl,
        repo
      );
    } catch (e) {
      log("failed to rewrite bare imports", e);
    }
  }

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

  let handoffURL: URL | undefined;

  if (
    url.hostname == self.location.hostname &&
    url.port == self.location.port &&
    url.protocol == self.location.protocol
  ) {
    try {
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
            return response;
          }

          if (cacheableStatuses.includes(response.status)) {
            log(`caching ${handoffURL}`);
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
