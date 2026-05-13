import type {
  ServiceWorkerRepoChannelListener,
  SetupServiceWorkerOptions,
  SetupServiceWorkerResult,
} from "./types.js";
import debug from "debug";

const debugging = debug.enabled("patchwork:serviceworker");

const key = "patchworkServiceWorkerCacheVersion";
let nextRepoChannelId = 0;
let serviceWorkerInstanceId: string | undefined;

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
  sw.postMessage({ type: "debug", debug: debugging });
  const cachename = getServiceWorkerCacheVersion();
  if (cachename) sw.postMessage({ type: "cachename", cachename });
}

function updateServiceWorkerInstanceId(next: unknown) {
  if (typeof next !== "string") return false;
  const changed =
    serviceWorkerInstanceId != null && serviceWorkerInstanceId !== next;
  serviceWorkerInstanceId = next;
  return changed;
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

async function openRepoChannel(): Promise<{
  port: MessagePort;
  workerInstanceChanged: boolean;
}> {
  const controller = navigator.serviceWorker.controller;
  if (!controller) {
    throw new Error("no service worker controller");
  }

  // Send a MessagePort so the SW's repo can sync with clients, and wait for
  // the SW to confirm its repo is constructed before returning. The
  // MessageChannel adapter's whenReady() force-resolves after 100ms regardless
  // of the other end's state, so it can't be used as a real readiness signal
  // on first install (when the SW still has to fetch wasm and build its repo).
  const id = ++nextRepoChannelId;
  let workerInstanceChanged = false;
  const { port1, port2 } = new MessageChannel();
  const swReady = new Promise<void>((resolve, reject) => {
    let timeout: ReturnType<typeof setTimeout>;
    const cleanup = () => {
      clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener("message", listener);
    };
    const listener = (event: MessageEvent) => {
      if (event.data?.id != null && event.data.id !== id) return;
      if (event.data?.type === "port-ready") {
        workerInstanceChanged = updateServiceWorkerInstanceId(
          event.data.workerInstanceId
        );
        cleanup();
        resolve();
      } else if (event.data?.type === "port-failed") {
        workerInstanceChanged = updateServiceWorkerInstanceId(
          event.data.workerInstanceId
        );
        cleanup();
        reject(new Error(`service worker init failed: ${event.data.error}`));
      }
    };
    navigator.serviceWorker.addEventListener("message", listener);
    // Failsafe: don't block boot forever if the SW never replies. Surface the
    // issue and let the rest of the site come up rather than hanging on a
    // blank page.
    timeout = setTimeout(() => {
      cleanup();
      reject(new Error("service worker port-ready timeout"));
    }, 30_000);
  });
  controller.postMessage({ type: "port", id }, [port2]);
  try {
    await swReady;
  } catch (err) {
    console.warn(
      "proceeding without SW ready ack:",
      err instanceof Error ? err.message : err
    );
  }
  return { port: port1, workerInstanceChanged };
}

export default async function setupServiceWorker(
  options?: SetupServiceWorkerOptions
): Promise<SetupServiceWorkerResult> {
  const repoChannelListeners = new Set<ServiceWorkerRepoChannelListener>();
  let reconnectPromise: Promise<void> | null = null;

  const reconnectRepoChannels = (reason: string) => {
    if (reconnectPromise) return reconnectPromise;
    reconnectPromise = (async () => {
      console.info(
        `%cservice worker ${reason}, reconnecting repo channels...`,
        "color: pink; font-weight: bold"
      );
      configureServiceWorker(navigator.serviceWorker.controller);
      for (const listener of repoChannelListeners) {
        try {
          const { port } = await openRepoChannel();
          await listener(port);
        } catch (err) {
          console.error("service worker repo channel listener failed", err);
        }
      }
    })().finally(() => {
      reconnectPromise = null;
    });
    return reconnectPromise;
  };

  const pingServiceWorker = async () => {
    const controller = navigator.serviceWorker.controller;
    if (!controller) return;
    const { port1, port2 } = new MessageChannel();
    const pong = new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        port1.close();
        reject(new Error("service worker pong timeout"));
      }, 5_000);
      port1.onmessage = (event) => {
        clearTimeout(timeout);
        port1.close();
        resolve(event.data?.workerInstanceId);
      };
    });
    controller.postMessage({ type: "ping" }, [port2]);
    try {
      const restarted = updateServiceWorkerInstanceId(await pong);
      if (restarted) {
        await reconnectRepoChannels("restarted");
      }
    } catch (err) {
      console.warn(
        "service worker ping failed:",
        err instanceof Error ? err.message : err
      );
    }
  };

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

  // Keepalive — Chromium idles out service workers after ~30s of inactivity,
  // which tears down the in-memory Repo and forces a cold restart on the next
  // fetch. Ping through a MessageChannel so we can detect when a restarted SW
  // has a new in-memory Repo and reconnect all repo channels.
  setInterval(() => {
    void pingServiceWorker();
  }, 20_000);

  // Reconnect on future SW updates (added after setup so the initial
  // activation doesn't notify before callers subscribe).
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    void reconnectRepoChannels("took control").catch((err) => {
      console.error("service worker reconnect failed", err);
    });
  });

  console.log(
    "service worker alive, loading %c patchwork system ",
    "background: #fcf2f0; color: #333; border: 2px solid; border-radius: 4px"
  );

  return {
    async subscribeToRepoChannel(listener) {
      const { port, workerInstanceChanged } = await openRepoChannel();
      if (workerInstanceChanged) {
        await reconnectRepoChannels("restarted");
      }
      repoChannelListeners.add(listener);
      try {
        await listener(port);
      } catch (err) {
        repoChannelListeners.delete(listener);
        throw err;
      }
      return () => repoChannelListeners.delete(listener);
    },
  };
}
