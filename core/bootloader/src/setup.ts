import type { SetupServiceWorkerOptions } from "./types.js";
import debug from "debug";

const debugging = debug.enabled("patchwork:serviceworker");

const key = "patchworkServiceWorkerCacheVersion";

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

export default async function setupServiceWorker(
  options?: SetupServiceWorkerOptions
) {
  // Backwards compat: if an old service worker sends handoff "request" messages,
  // immediately reject them so its fetch handler doesn't hang forever.
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "request" && event.data.id != null) {
      navigator.serviceWorker.controller?.postMessage({
        type: "response",
        id: event.data.id,
        response: {
          body: "service worker upgraded, please refresh",
          status: 503,
          headers: { "content-type": "text/plain" },
        },
      });
    }
  });

  navigator.serviceWorker.addEventListener("controllerchange", function () {
    console.info(
      "%cnew service worker took control, reloading...",
      "color: pink; font-weight: bold"
    );
    location.reload();
  });

  const path = options?.path ?? "/service-worker.js";
  const reg = await navigator.serviceWorker.register(path, { type: "module" });

  // If there's an update waiting or installing, wait for it to activate
  if (reg.installing || reg.waiting) {
    await waitForActive(reg);
  }

  const active = reg.active!;
  active.postMessage({ type: "debug", debug: debugging });

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

  // Tell the SW which sync server to use and wait for it to be ready.
  // getRepo() in the SW blocks until it receives this message, connects
  // the WebSocket, and confirms back via the ack port.
  if (options?.syncServer) {
    const { port1: ackPort, port2: ackRemote } = new MessageChannel();
    await new Promise<void>((resolve) => {
      ackPort.onmessage = () => {
        ackPort.close();
        resolve();
      };
      navigator.serviceWorker.controller!.postMessage(
        { type: "set-sync-server", url: options.syncServer },
        [ackRemote]
      );
    });
  }

  // Send a MessagePort so the SW's repo can sync with clients
  const { port1, port2 } = new MessageChannel();
  navigator.serviceWorker.controller!.postMessage({ type: "port" }, [port2]);

  console.log(
    "service worker alive, loading %c patchwork system ",
    "background: #fcf2f0; color: #333; border: 2px solid; border-radius: 4px"
  );

  return { port: port1 };
}
