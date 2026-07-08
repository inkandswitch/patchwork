import type {
  ServiceWorkerRepoChannelListener,
  SetupServiceWorkerOptions,
  SetupServiceWorkerResult,
  SyncStateDocMessage,
} from "./types.js";
import {
  readClassicSyncServer,
  DEFAULT_CLASSIC_SYNC_SERVER,
} from "./sync-config.js";
import debug from "debug";
import { donatePort } from "@automerge/automerge-repo/worker-port";

const serviceWorkerDebugging = debug.enabled("patchwork:serviceworker");
const workerDebugging = debug.enabled("patchwork:automergeworker");

// Diagnostic [lifecycle] logging, on by default. Disable via
// localStorage["patchwork:lifecycle-logs"] = "off". Read live at log time.
const LIFECYCLE_LOG_KEY = "patchwork:lifecycle-logs";
export function lifecycleLoggingEnabled(): boolean {
  try {
    const v = globalThis.localStorage?.getItem(LIFECYCLE_LOG_KEY);
    return v !== "off" && v !== "false" && v !== "0" && v !== "no";
  } catch {
    return true;
  }
}

// The SW can't read localStorage, so it always emits [lifecycle] markers and
// forwards them as `sw-lifecycle`; gate rendering here on the live toggle.
let swLifecycleListenerInstalled = false;
function installServiceWorkerLogForwarding(): void {
  if (swLifecycleListenerInstalled) return;
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
  swLifecycleListenerInstalled = true;
  navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
    const data = event.data;
    if (data?.type !== "sw-lifecycle") return;
    if (!lifecycleLoggingEnabled()) return;
    const fn = (console as any)[data.level] ?? console.log;
    fn(`[service-worker] ${data.msg}`);
  });
}

const key = "patchworkServiceWorkerCacheVersion";
const defaultServiceWorkerCacheName = "patchwork";
let nextRepoChannelId = 0;

function bumpServiceWorkerCacheVersion() {
  const version = new Date().valueOf().toString(36);
  localStorage.setItem(key, version);
  return getServiceWorkerCacheVersion();
}

function getServiceWorkerCacheVersion() {
  return localStorage.getItem(key);
}

function setServiceWorkerCacheName(sw: ServiceWorker | null) {
  if (!sw) {
    throw new Error("no service worker!");
  }
  sw.postMessage({
    type: "cachename",
    cachename: getServiceWorkerCacheVersion() ?? defaultServiceWorkerCacheName,
  });
}

export function bumpServiceWorkerCache(
  sw = navigator.serviceWorker.controller
) {
  bumpServiceWorkerCacheVersion();
  setServiceWorkerCacheName(sw);
}

(window as any).bumpServiceWorkerCache = bumpServiceWorkerCache;

function configureServiceWorker(sw: ServiceWorker | null) {
  if (!sw) return;
  sw.postMessage({ type: "debug", debug: serviceWorkerDebugging });
  sw.postMessage({
    type: "cachename",
    cachename: getServiceWorkerCacheVersion() ?? defaultServiceWorkerCacheName,
  });
}

// ── The automerge worker ───────────────────────────────────────────────
// The automerge repo lives in a SharedWorker (not the service worker). One
// instance is shared by every tab and lives exactly as long as any tab
// does, so there's no keepalive ping and no restart detection: if we're
// alive, it's alive. Repo sync ports are passed to it over its connect
// port; it talks to the service worker over a BroadcastChannel.

let automergeWorkerPath = "/automerge-worker.js";
let automergeWorker: SharedWorker | undefined;

// SharedWorker proxy entry that owns the subduction WebSocket. Chrome can't
// spawn workers from inside a SharedWorker, so each tab offers this proxy's
// port to the automerge worker (which requests one via its port provider).
// Being a SharedWorker itself, the proxy — and the donated worker↔worker
// port — outlives the donor tab. Emitted at /packages/... via externals.ts.
const SUBDUCTION_IO_WORKER_URL =
  "/packages/@automerge/automerge-repo/subduction-websocket-worker-shared.js";

// A/B bench toggle for the subduction socket (see getSubductionEndpoints in
// automerge-worker.ts). Set localStorage["patchwork:ws-mode"] = "inline" to
// run the socket on the worker thread (control arm). Passed as a query param
// because SharedWorker scope has no localStorage — which also gives each mode
// its own worker instance, so arms can't share state.
function wsMode(): string | null {
  try {
    return globalThis.localStorage?.getItem("patchwork:ws-mode");
  } catch {
    return null;
  }
}

export function getAutomergeWorker(): SharedWorker {
  if (!automergeWorker) {
    const mode = wsMode();
    const workerUrl = mode
      ? `${automergeWorkerPath}?ws-mode=${encodeURIComponent(mode)}`
      : automergeWorkerPath;
    automergeWorker = new SharedWorker(workerUrl, {
      name: "patchwork-automerge",
      type: "module",
    });
    // Control replies (port-ready &c) come back on this port, so it needs
    // start() — we listen with addEventListener, not onmessage.
    automergeWorker.port.start();
    // Surface the SharedWorker's console output and uncaught errors in this
    // tab's console (it has its own console that's awkward to find otherwise).
    automergeWorker.port.addEventListener("message", (event: MessageEvent) => {
      if (event.data?.type === "sync-state") {
        dispatchSyncState(event.data as SyncStateDocMessage);
        return;
      }
      if (event.data?.type === "drift-samples") {
        // Keepalive-drift samples from the worker's bench probe. Kept on a
        // bounded window global for the Playwright bench to harvest.
        const sink = ((window as any).__driftSamples ??= []) as number[];
        sink.push(...event.data.samples);
        if (sink.length > 10_000) sink.splice(0, sink.length - 10_000);
        return;
      }
      if (event.data?.type !== "console") return;
      const { level, args } = event.data;
      // Gate forwarded [lifecycle] logs on the toggle too.
      if (
        !lifecycleLoggingEnabled() &&
        typeof args?.[0] === "string" &&
        args[0].includes("[lifecycle]")
      ) {
        return;
      }
      const fn = (console as any)[level] ?? console.log;
      // The worker's logs (debug library, the worker's own log()) carry %c
      // format directives in args[0] with CSS in the following args. Prefix
      // the tag into the format string rather than as a separate positional,
      // or the %c would no longer be in arg 0 and the CSS would print raw.
      if (typeof args[0] === "string") {
        fn(`[automerge-worker] ${args[0]}`, ...args.slice(1));
      } else {
        fn("[automerge-worker]", ...args);
      }
    });
    automergeWorker.port.postMessage({ type: "debug", debug: workerDebugging });

    // Offer the subduction io proxy's port; the worker's port provider pulls
    // it when (re)constructing its WorkerWebSocketEndpoint.
    donatePort(automergeWorker.port, () => {
      const io = new SharedWorker(SUBDUCTION_IO_WORKER_URL, {
        type: "module",
        name: "subduction-websocket",
      });
      return io.port;
    });

    installWorkerDeathDetection(automergeWorker);
  }
  return automergeWorker;
}

/**
 * Detect when the automerge SharedWorker dies or restarts: control-port close,
 * worker error, changed instance id, or an unanswered heartbeat while the tab
 * is visible (a miss while hidden is more likely suspension). [lifecycle]-tagged.
 */
function installWorkerDeathDetection(worker: SharedWorker): void {
  const stamp = () => new Date().toISOString();
  const warn = (msg: string) => {
    if (lifecycleLoggingEnabled()) console.warn(`[lifecycle] ${stamp()} ${msg}`);
  };
  const info = (msg: string) => {
    if (lifecycleLoggingEnabled()) console.info(`[lifecycle] ${stamp()} ${msg}`);
  };

  let instanceId: string | undefined;
  let lastPongAt = Date.now();
  let warnedUnresponsive = false;

  worker.port.addEventListener("message", (event: MessageEvent) => {
    const data = event.data;
    if (data?.type !== "hello" && data?.type !== "pong") return;
    if (data.type === "pong") {
      lastPongAt = Date.now();
      warnedUnresponsive = false;
    }
    if (instanceId === undefined) {
      instanceId = data.instanceId;
      info(`automerge SharedWorker instance ${data.instanceId} (via ${data.type})`);
    } else if (data.instanceId && data.instanceId !== instanceId) {
      warn(
        `automerge SharedWorker RESTARTED (instance ${data.instanceId}, ` +
          `was ${instanceId}) — fresh peerId + cold state; docs need re-subscribe`
      );
      instanceId = data.instanceId;
    }
  });

  // Fires when the SharedWorker is destroyed (where supported).
  worker.port.addEventListener("close", () => {
    warn("automerge SharedWorker control port CLOSED — worker terminated");
  });

  worker.addEventListener("error", event => {
    warn(`automerge SharedWorker error: ${(event as ErrorEvent).message || event}`);
  });

  // A missed pong while the tab is visible means the worker likely died (an
  // active tab keeps it alive); a miss while hidden is more likely suspension.
  const HEARTBEAT_MS = 10_000;
  const HEARTBEAT_TIMEOUT_MS = 25_000;
  let seq = 0;
  setInterval(() => {
    try {
      worker.port.postMessage({ type: "ping", id: ++seq });
    } catch {
      // Port already torn down — the "close" handler covers that case.
    }
    const silentMs = Date.now() - lastPongAt;
    const visible =
      typeof document === "undefined" || document.visibilityState === "visible";
    if (silentMs > HEARTBEAT_TIMEOUT_MS && visible && !warnedUnresponsive) {
      warnedUnresponsive = true;
      warn(
        `automerge SharedWorker UNRESPONSIVE ~${Math.round(silentMs / 1000)}s ` +
          `while tab visible — likely died/crashed`
      );
    }
  }, HEARTBEAT_MS);
}

// ── Sync-state subscriptions ────────────────────────────────────────────
// The automerge worker pushes per-document heads only to the tabs that ask for
// them (see SyncStateDocMessage). We ref-count locally so several callers in
// this tab can watch the same doc with a single worker subscription, and tear
// the worker subscription down when the last local watcher drops.
type SyncStateListener = (update: SyncStateDocMessage) => void;
const syncStateListeners = new Map<string, Set<SyncStateListener>>();

function dispatchSyncState(update: SyncStateDocMessage): void {
  const listeners = syncStateListeners.get(update.documentId);
  if (!listeners) return;
  for (const listener of listeners) {
    try {
      listener(update);
    } catch (err) {
      console.error("sync-state listener threw", err);
    }
  }
}

export function subscribeSyncState(
  documentId: string,
  listener: SyncStateListener
): () => void {
  const worker = getAutomergeWorker();
  let listeners = syncStateListeners.get(documentId);
  if (!listeners) {
    syncStateListeners.set(documentId, (listeners = new Set()));
    // First local watcher for this doc — ask the worker to start pushing it.
    worker.port.postMessage({ type: "sync-sub", documentId });
  }
  listeners.add(listener);

  let active = true;
  return () => {
    if (!active) return; // idempotent
    active = false;
    const set = syncStateListeners.get(documentId);
    if (!set) return;
    set.delete(listener);
    if (set.size === 0) {
      syncStateListeners.delete(documentId);
      worker.port.postMessage({ type: "sync-unsub", documentId });
    }
  };
}

export function connectClassicSync(
  server: string = readClassicSyncServer()
): Promise<void> {
  const url = server.trim() || DEFAULT_CLASSIC_SYNC_SERVER;
  if (!/^wss?:\/\//.test(url)) {
    return Promise.reject(
      new Error(`invalid classic sync server URL: ${server}`)
    );
  }

  const worker = getAutomergeWorker();
  const { port1, port2 } = new MessageChannel();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      port1.close();
      reject(new Error("connect-classic-sync timeout"));
    }, 30_000);
    port1.onmessage = (event) => {
      clearTimeout(timeout);
      port1.close();
      if (event.data?.type === "connect-classic-sync-ready") {
        resolve();
      } else {
        reject(new Error(event.data?.error ?? "connect-classic-sync failed"));
      }
    };
    worker.port.postMessage({ type: "connect-classic-sync", server: url }, [
      port2,
    ]);
  });
}

/** Wait for a registration to have an active worker */
function waitForActive(reg: ServiceWorkerRegistration): Promise<ServiceWorker> {
  if (reg.active) return Promise.resolve(reg.active);
  const worker = reg.installing || reg.waiting;
  if (!worker)
    return Promise.reject(new Error("no service worker in registration"));
  return new Promise((resolve) => {
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") resolve(worker);
    });
  });
}

async function openRepoChannel(): Promise<MessagePort> {
  const worker = getAutomergeWorker();

  // Send a MessagePort so the worker's repo can sync with this tab, and wait
  // for the worker to confirm its repo is constructed before returning. The
  // MessageChannel adapter's whenReady() force-resolves after 100ms regardless
  // of the other end's state, so it can't be used as a real readiness signal
  // on first boot (when the worker still has to fetch wasm and build its repo).
  const id = ++nextRepoChannelId;
  const { port1, port2 } = new MessageChannel();
  const workerReady = new Promise<void>((resolve, reject) => {
    let timeout: ReturnType<typeof setTimeout>;
    const cleanup = () => {
      clearTimeout(timeout);
      worker.port.removeEventListener("message", listener);
    };
    const listener = (event: MessageEvent) => {
      if (event.data?.id !== id) return;
      if (event.data?.type === "port-ready") {
        cleanup();
        resolve();
      } else if (event.data?.type === "port-failed") {
        cleanup();
        reject(new Error(`automerge worker init failed: ${event.data.error}`));
      }
    };
    worker.port.addEventListener("message", listener);
    // Failsafe: don't block boot forever if the worker never replies. Surface
    // the issue and let the rest of the site come up rather than hanging on a
    // blank page.
    timeout = setTimeout(() => {
      cleanup();
      reject(new Error("automerge worker port-ready timeout"));
    }, 30_000);
  });
  worker.port.postMessage({ type: "port", id }, [port2]);
  try {
    await workerReady;
  } catch (err) {
    console.warn(
      "proceeding without worker ready ack:",
      err instanceof Error ? err.message : err
    );
  }
  return port1;
}

/** Open a fresh repo sync port to the automerge worker (dev console). */
function getRepoChannel(): MessagePort {
  const worker = getAutomergeWorker();
  const { port1, port2 } = new MessageChannel();
  worker.port.postMessage({ type: "port", id: ++nextRepoChannelId }, [port2]);
  return port1;
}

export default async function setupServiceWorker(
  options?: SetupServiceWorkerOptions
): Promise<SetupServiceWorkerResult> {
  // Attach the SW→tab [lifecycle] log bridge as early as possible so boot /
  // install / activate markers from the controlling worker are rendered here.
  installServiceWorkerLogForwarding();
  localStorage.removeItem(key);

  if (options?.workerPath) automergeWorkerPath = options.workerPath;

  // Start the automerge worker right away so it boots (wasm, repo) while the
  // service worker installs.
  const shared = getAutomergeWorker();
  // todo delete

  const path = options?.path ?? "/service-worker.js";
  // No controller at this point means the page loaded without a service
  // worker — i.e. this is a first-time install (or a hard reload). Wait for
  // activation so the app boots with the SW in control of generated fetches.
  const reg = await navigator.serviceWorker.register(path, { type: "module" });

  // If there's an update waiting or installing, wait for it to activate
  let active = reg.active;
  if (reg.installing || reg.waiting) {
    active = await waitForActive(reg);
  }

  configureServiceWorker(active);

  // Wait for the controller to be available
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => resolve(),
        { once: true }
      );
    });
  }

  // A replacement service worker boots with the default cache name — re-send
  // its configuration whenever a new one takes control.
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    configureServiceWorker(navigator.serviceWorker.controller);
  });

  console.log(
    "service worker alive, loading %c patchwork system ",
    "background: #fcf2f0; color: #333; border: 2px solid; border-radius: 4px"
  );

  // todon't
  (window as any).killsw = () => {
    if (automergeWorker) {
      automergeWorker.port.close();
      automergeWorker = undefined;
    }
  };

  return {
    shared,
    connectClassicSync,
    getRepoChannel,
    subscribeSyncState,
    async subscribeToRepoChannel(listener: ServiceWorkerRepoChannelListener) {
      // The automerge worker outlives the page, so unlike the old in-service-
      // worker repo there's nothing to reconnect: one port, handed over once.
      await listener(await openRepoChannel());
      return () => {};
    },
  };
}
