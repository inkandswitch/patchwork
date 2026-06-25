import type {
  ServiceWorkerDiagnostics,
  ServiceWorkerRepoChannelListener,
  SetupServiceWorkerOptions,
  SetupServiceWorkerResult,
  WorkerDiagnostics,
} from "./types.js";
import {
  readClassicSyncServer,
  DEFAULT_CLASSIC_SYNC_SERVER,
} from "./sync-config.js";
import debug from "debug";

// Worker/SW console logging defaults ON. If the user has configured the `debug`
// package at all (via `localStorage.debug`), honour it so they can quiet or
// scope things; otherwise default to enabled. Either way the persistent ring
// loggers capture everything for the diagnostics bundle — this only controls
// live console *display*.
function consoleDisplayEnabled(namespace: string): boolean {
  try {
    if (globalThis.localStorage?.getItem("debug")) {
      return debug.enabled(namespace);
    }
  } catch {
    // localStorage unavailable — fall through to default-on
  }
  return true;
}

const serviceWorkerDebugging = consoleDisplayEnabled("patchwork:serviceworker");
const workerDebugging = consoleDisplayEnabled("patchwork:automergeworker");

const key = "patchworkServiceWorkerCacheVersion";
let nextRepoChannelId = 0;

function bumpServiceWorkerCacheVersion() {
  const version = new Date().valueOf().toString(36);
  localStorage.setItem(key, version);
  return getServiceWorkerCacheVersion();
}

function getServiceWorkerCacheVersion() {
  return localStorage.getItem(key);
}

function getOrCreateServiceWorkerCacheVersion() {
  const existing = getServiceWorkerCacheVersion();
  if (existing) return existing;
  return bumpServiceWorkerCacheVersion();
}

function setServiceWorkerCacheName(sw: ServiceWorker | null) {
  if (!sw) {
    throw new Error("no service worker!");
  }
  sw.postMessage({
    type: "cachename",
    cachename: getOrCreateServiceWorkerCacheVersion(),
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
  const cachename = getServiceWorkerCacheVersion();
  if (cachename) sw.postMessage({ type: "cachename", cachename });
}

// ── The automerge worker ───────────────────────────────────────────────
// The automerge repo lives in a SharedWorker (not the service worker). One
// instance is shared by every tab and lives exactly as long as any tab
// does, so there's no keepalive ping and no restart detection: if we're
// alive, it's alive. Repo sync ports are passed to it over its connect
// port; it talks to the service worker over a BroadcastChannel.

let automergeWorkerPath = "/automerge-worker.js";
let automergeWorker: SharedWorker | undefined;

function getAutomergeWorker(): SharedWorker {
  if (!automergeWorker) {
    automergeWorker = new SharedWorker(automergeWorkerPath, {
      name: "patchwork-automerge",
      type: "module",
    });
    // Control replies (port-ready &c) come back on this port, so it needs
    // start() — we listen with addEventListener, not onmessage.
    automergeWorker.port.start();
    // Surface the SharedWorker's console output and uncaught errors in this
    // tab's console (it has its own console that's awkward to find otherwise).
    automergeWorker.port.addEventListener("message", (event: MessageEvent) => {
      if (event.data?.type !== "console") return;
      const { level, args } = event.data;
      const fn = (console as any)[level] ?? console.log;
      fn("[automerge-worker]", ...args);
    });
    automergeWorker.port.postMessage({ type: "debug", debug: workerDebugging });
  }
  return automergeWorker;
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

/**
 * Ask the automerge SharedWorker for its diagnostics snapshot. Resolves `null`
 * on timeout so a wedged worker (often the thing being diagnosed) can't hang
 * the export.
 */
export function requestWorkerDiagnostics(
  timeoutMs = 5_000
): Promise<WorkerDiagnostics | null> {
  const worker = getAutomergeWorker();
  const { port1, port2 } = new MessageChannel();
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      port1.close();
      resolve(null);
    }, timeoutMs);
    port1.onmessage = (event) => {
      clearTimeout(timeout);
      port1.close();
      resolve(
        event.data?.type === "diagnostics-result" ? event.data.data : null
      );
    };
    try {
      worker.port.postMessage({ type: "diagnostics" }, [port2]);
    } catch {
      clearTimeout(timeout);
      resolve(null);
    }
  });
}

/**
 * Ask the service worker for its diagnostics snapshot. Resolves `null` if there
 * is no controlling service worker or it doesn't reply within `timeoutMs`.
 */
export function requestServiceWorkerDiagnostics(
  timeoutMs = 5_000
): Promise<ServiceWorkerDiagnostics | null> {
  const controller = navigator.serviceWorker?.controller;
  if (!controller) return Promise.resolve(null);
  const { port1, port2 } = new MessageChannel();
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      port1.close();
      resolve(null);
    }, timeoutMs);
    port1.onmessage = (event) => {
      clearTimeout(timeout);
      port1.close();
      resolve(
        event.data?.type === "diagnostics-result" ? event.data.data : null
      );
    };
    try {
      controller.postMessage({ type: "diagnostics" }, [port2]);
    } catch {
      clearTimeout(timeout);
      resolve(null);
    }
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
  if (options?.workerPath) automergeWorkerPath = options.workerPath;

  // Start the automerge worker right away so it boots (wasm, repo) while the
  // service worker installs.
  getAutomergeWorker();

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

  return {
    connectClassicSync,
    getRepoChannel,
    requestWorkerDiagnostics,
    requestServiceWorkerDiagnostics,
    async subscribeToRepoChannel(listener: ServiceWorkerRepoChannelListener) {
      // The automerge worker outlives the page, so unlike the old in-service-
      // worker repo there's nothing to reconnect: one port, handed over once.
      await listener(await openRepoChannel());
      return () => {};
    },
  };
}
