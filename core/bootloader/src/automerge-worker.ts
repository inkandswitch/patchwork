// The automerge repo for a patchwork site. This runs in a SharedWorker, so
// one instance serves every tab and lives exactly as long as any tab does —
// no keepalive pings, no idle teardown.
//
// The service worker holds no repo. When it misses the cache for a special
// URL it broadcasts a HandoffRequestMessage on HANDOFF_CHANNEL; we resolve
// the automerge URL, write the response into the service worker's cache
// (keyed by a Request reconstructed to match the one it's holding), and
// reply on the same channel.

// Heavy imports — marked external by the service-worker vite plugin,
// resolved to /packages/... URLs at build time. The worker is created with
// type:"module" so the browser fetches these as regular network requests.
// Uses /slim so wasm is fetched from /automerge.wasm (emitted by the vite
// plugin) instead of bundling the ~3MB base64 string.
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
  type DocHandle,
} from "@automerge/automerge-repo/slim";
import { resolvePath } from "@inkandswitch/patchwork-filesystem";

// Small adapters — bundled directly into the worker
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import {
  initializeAutomergeRepoKeyhiveRust,
  initKeyhiveWasm,
  type AutomergeRepoKeyhiveRust,
} from "@automerge/automerge-repo-keyhive";

import {
  HANDOFF_CHANNEL,
  type HandoffCachedMessage,
  type HandoffOnlineMessage,
  type HandoffRequest,
  type HandoffRequestMessage,
  type HandoffResponseMessage,
} from "./types.js";

declare const __SITE_NAME__: string;
declare const __KEYHIVE__: boolean;
declare const __KEYHIVE_SYNC_SERVER__: boolean;

let debugging = false;

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

// keyhive.sync.automerge.org's keyhive identity (issuer d7f41e6f…).
const KEYHIVE_SYNC_SERVER_PEER_ID =
  "1/Qebw9O69oH8T/ejYMhFup0tNBh69I3ytGqsmIl358=";
const KEYHIVE_SYNC_SERVER_CONTACT_CARD_JSON =
  '{"Rotate":{"payload":{"old":[73,163,230,244,111,233,153,119,133,211,134,237,111,36,52,131,22,50,54,144,150,45,227,235,128,36,33,217,190,198,55,75],"new":[109,115,204,144,178,114,182,238,113,124,4,139,249,76,220,44,128,104,194,68,187,184,82,241,94,145,104,198,159,122,186,43]},"issuer":[215,244,30,111,15,78,235,218,7,241,63,222,141,131,33,22,234,116,180,208,97,235,210,55,202,209,170,178,98,37,223,159],"signature":[178,64,85,76,51,199,196,151,129,14,191,53,127,191,34,223,97,238,95,109,118,179,152,17,205,188,204,177,116,166,147,231,192,201,48,137,19,214,180,45,108,104,34,8,14,63,115,139,215,142,4,179,233,89,150,218,174,168,107,23,8,109,228,6]}}';

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

const siteName =
  typeof __SITE_NAME__ !== "undefined" ? __SITE_NAME__ : "tiny-patchwork";

const cacheableStatuses = [200, 203, 204];

function log(...args: any[]) {
  if (!debugging) return;
  console.log.call(
    console,
    `%cpatchwork:automergeworker%c\n`,
    `color: #ffaa00; font-weight: bold`,
    "color: inherit",
    ...args
  );
}

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
        fetch("/automerge.wasm?worker").then((r) => r.arrayBuffer()),
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
          peerId: ("automerge-worker-" +
            Math.random()
              .toString(36)
              .slice(2)) as import("@automerge/automerge-repo/slim").PeerId,
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
      const keyhiveStorage = new IndexedDBStorageAdapter(`${siteName}-keyhive`);

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
        ...(useKeyhiveSyncServer
          ? {
              serverPeerId: KEYHIVE_SYNC_SERVER_PEER_ID as any,
              serverContactCardJson: KEYHIVE_SYNC_SERVER_CONTACT_CARD_JSON,
            }
          : {}),
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
      // would deadlock that path and starve the handoff handler.
      repo.networkSubsystem.whenReady().then(() => {
        log("repo network subsystem ready");
      });

      hive.networkAdapter.whenReady().then(() => {
        (hive.networkAdapter as any).syncKeyhive();
      });

      return { hive, repo };
    })();
    // If construction fails (e.g. wasm fetch errors out), don't permanently
    // cache the rejection — clear the slot so the next caller can retry from
    // scratch.
    repoHivePromise.catch(() => {
      repoHivePromise = null;
    });
  }
  return repoHivePromise;
}

// ── Tab connections ────────────────────────────────────────────────────

// Each tab connects with a control port (the SharedWorker connect port) and
// opens repo MessageChannel ports through it. `adapter` is what was
// registered with the network subsystem (the MessageChannelNetworkAdapter,
// or the keyhive wrapper around it); `mcAdapter` is always the underlying
// MessageChannel adapter so we can disconnect the port itself.
type RepoChannel = {
  adapter: { disconnect(): void };
  mcAdapter: MessageChannelNetworkAdapter;
  port: MessagePort;
};
type Connection = {
  channels: Set<RepoChannel>;
};

function dropRepoChannel(repo: Repo, channel: RepoChannel) {
  // removeNetworkAdapter pulls the adapter out of networkSubsystem.adapters and
  // calls adapter.disconnect(), which (for the MessageChannel adapter) emits the
  // "close"/"peer-disconnected" events that also clear #adaptersByPeer.
  try {
    repo.networkSubsystem.removeNetworkAdapter(channel.adapter as any);
  } catch (err) {
    console.error("removeNetworkAdapter failed", err);
  }
  // Belt and braces for the keyhive path, where the registered adapter is a
  // wrapper: make sure the underlying port is disconnected and closed too.
  try {
    channel.mcAdapter.disconnect();
  } catch {}
  try {
    channel.port.close();
  } catch {}
}

async function dropConnection(connection: Connection) {
  if (!connection.channels.size || !repoHivePromise) return;
  const { repo } = await getRepoHive();
  log(`tab gone — removing ${connection.channels.size} network adapter(s)`);
  for (const channel of connection.channels) {
    dropRepoChannel(repo, channel);
  }
  connection.channels.clear();
}

// Connect client MessagePorts to the repo for sync
async function connectPort(port: MessagePort, connection: Connection) {
  const { hive, repo } = await getRepoHive();
  const networkAdapter = new MessageChannelNetworkAdapter(port, {
    useWeakRef: true,
  });

  const track = (adapter: { disconnect(): void }) => {
    connection.channels.add({ adapter, mcAdapter: networkAdapter, port });
  };

  if (!hive) {
    repo.networkSubsystem.addNetworkAdapter(networkAdapter);
    track(networkAdapter);
    return;
  }

  const onlyShareWithHardcodedServerPeerId = false;
  const periodicallyRequestKeyhiveSync = false;
  const keyhiveNetworkAdapter = hive.createKeyhiveNetworkAdapter(
    networkAdapter,
    onlyShareWithHardcodedServerPeerId,
    periodicallyRequestKeyhiveSync,
    2000
  );

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

function handleControlMessage(
  event: MessageEvent,
  controlPort: MessagePort,
  connection: Connection
) {
  const data = event.data;
  if (data?.type === "port") {
    log("received repo channel");
    const [repoPort] = event.ports;
    const id = data.id;
    connectPort(repoPort, connection).then(
      () => controlPort.postMessage({ type: "port-ready", id }),
      (err) => {
        console.error("connectPort failed", err);
        // Tell the client we failed so it doesn't hang forever.
        controlPort.postMessage({
          type: "port-failed",
          id,
          error: String(err),
        });
      }
    );
  } else if (data?.type === "debug") {
    debugging = data.debug;
    log("automerge worker debugging enabled");
  } else if (data?.type === "connect-classic-sync") {
    const [replyPort] = event.ports;
    const server =
      typeof data.server === "string"
        ? data.server
        : DEFAULT_CLASSIC_SYNC_SERVER;
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
      });
  }
}

self.addEventListener("connect", (event) => {
  const controlPort = (event as MessageEvent).ports[0];
  const connection: Connection = { channels: new Set() };

  controlPort.addEventListener("message", (messageEvent) => {
    handleControlMessage(messageEvent as MessageEvent, controlPort, connection);
  });

  // Fires when the owning page is destroyed. Browsers without the close
  // event fall back to the adapters' lazy useWeakRef cleanup.
  controlPort.addEventListener("close", () => {
    void dropConnection(connection);
  });

  controlPort.start();
});

// ── Automerge URL resolution ───────────────────────────────────────────

/**
 * Wait for the requested heads to appear in the handle's local history —
 * they may still be syncing toward us when the request lands. Resolves
 * false if the signal aborts before they arrive.
 */
function waitForHeads(
  handle: DocHandle<unknown>,
  hexHeads: string[],
  signal: AbortSignal
): Promise<boolean> {
  if (hasHeads(handle.doc(), hexHeads)) return Promise.resolve(true);
  if (signal.aborted) return Promise.resolve(false);
  return new Promise((resolve) => {
    const check = () => {
      if (!hasHeads(handle.doc(), hexHeads)) return;
      cleanup();
      resolve(true);
    };
    const onAbort = () => {
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      handle.off("heads-changed", check);
      signal.removeEventListener("abort", onAbort);
    };
    handle.on("heads-changed", check);
    signal.addEventListener("abort", onAbort);
    // The heads may have landed between the synchronous check above and
    // subscribing.
    check();
  });
}

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
  // The heads may not have synced to us yet — give them the rest of the
  // resolve window to arrive before giving up.
  if (!(await waitForHeads(baseHandle, hexHeads ?? [], signal))) {
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

// ── Handoff: resolve special URLs for the service worker ──────────────

const handoffChannel = new BroadcastChannel(HANDOFF_CHANNEL);

/**
 * Pull the special URL out of a handoff request, whichever generation of
 * service worker sent it. Returns null rather than throwing — a stale
 * worker on the other end of the channel can send us anything.
 */
function parseHandoffhandoffURL(request: HandoffRequest): URL | null {
  try {
    // The service worker already decoded the special URL out of the
    // request it's holding and sends it alongside.
    if (request.handoffURL) return new URL(request.handoffURL);
    // TODO(backcompat): a briefly-deployed shape sent the special URL in
    // request.url and the http URL in cacheKey.
    if (request.cacheKey) return new URL(request.url);
    // TODO(backcompat): older service workers send only the http URL,
    // special URL still URI-encoded in its pathname.
    return new URL(decodeURIComponent(new URL(request.url).pathname.slice(1)));
  } catch {
    return null;
  }
}

async function handleHandoffRequest(message: HandoffRequestMessage) {
  const { id, cachename, request } = message;

  const handoffURL = parseHandoffhandoffURL(request);
  if (!handoffURL) {
    console.error(
      `automerge worker couldn't parse a special url out of handoff request`,
      request
    );
    handoffChannel.postMessage({
      id,
      type: "response",
      response: {
        status: 400,
        body: `couldn't parse a special url out of ${request.url}`,
        headers: { "content-type": "text/plain" },
      },
    } satisfies HandoffResponseMessage);
    return;
  }

  if (handoffURL.protocol != "automerge:") {
    // This worker only resolves automerge: URLs. Other handlers may be
    // listening on the channel for other schemes — stay quiet rather than
    // clobbering their reply with an error.
    return log(`ignoring handoff ${id} for non-automerge url ${handoffURL}`);
  }

  let response: Response;
  try {
    log(`resolving handoff ${id} for ${handoffURL}`);
    response = await Promise.race([
      resolveAutomergeUrl(handoffURL),
      new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(new Error(`resolve timeout after ${RESOLVE_TIMEOUT_MS}ms`)),
          RESOLVE_TIMEOUT_MS
        )
      ),
    ]);
  } catch (error) {
    const body =
      error instanceof Error
        ? `${error.message}\n\n${error.stack}`
        : String(error);
    console.error(`automerge worker error resolving ${request.url}`, error);
    handoffChannel.postMessage({
      id,
      type: "response",
      response: {
        status: 500,
        body,
        headers: { "content-type": "text/plain" },
      },
    } satisfies HandoffResponseMessage);
    return;
  }

  try {
    if (cacheableStatuses.includes(response.status)) {
      // Reconstruct the request the service worker is holding so the entry
      // matches on its cache.match. (destination isn't constructible, but it
      // doesn't participate in cache matching.) request.url is the http URL
      // the SW is holding except in the briefly-deployed cacheKey shape.
      const cacheKey = new Request(request.cacheKey ?? request.url, {
        method: request.method,
        headers: request.headers,
        referrer: request.referrer,
      });
      const cache = await caches.open(cachename);
      await cache.put(cacheKey, response);
      log(`cached ${cacheKey.url} in ${cachename}`);
      handoffChannel.postMessage({
        id,
        type: "cached",
      } satisfies HandoffCachedMessage);
    } else {
      // Errors, redirects &c — things that shouldn't be cached — go back
      // inline for the service worker to serve directly.
      log(`responding inline to ${request.url} with ${response.status}`);
      handoffChannel.postMessage({
        id,
        type: "response",
        response: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: response.body ? await response.text() : undefined,
        },
      } satisfies HandoffResponseMessage);
    }
  } catch (error) {
    console.error(`automerge worker failed to reply for ${request.url}`, error);
    handoffChannel.postMessage({
      id,
      type: "response",
      response: {
        status: 500,
        body: String(error),
        headers: { "content-type": "text/plain" },
      },
    } satisfies HandoffResponseMessage);
  }
}

handoffChannel.addEventListener("message", (event) => {
  if (event.data?.type === "request") {
    void handleHandoffRequest(event.data as HandoffRequestMessage);
  }
});

// Announce ourselves so the service worker can re-broadcast any handoff
// requests that were sent while we were still booting.
handoffChannel.postMessage({ type: "online" } satisfies HandoffOnlineMessage);
