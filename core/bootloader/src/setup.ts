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

export default async function setupServiceWorker(
  options?: SetupServiceWorkerOptions
) {
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    async function () {
      console.log(
        "%cnew service worker. i'd imagine that refreshing would be a good idea, but... i'm scared",
        "color: pink; font-weight: bold"
      );
    }
  );

  const existingSw = await navigator.serviceWorker.getRegistration();

  return navigator.serviceWorker
    .register(options?.path ?? "/service-worker.js", { type: "module" })
    .then(async (sw) => {
      sw.active?.postMessage({
        type: "debug",
        debug: debugging,
      });

      if (!existingSw?.active) {
        // bump the sw cache once
        bumpServiceWorkerCache(sw.installing);
        queueMicrotask(() => location.reload());
        return;
      }

      // Wait for the controller to be available
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
        });
      }

      // Send a MessagePort so the SW's repo can sync with clients
      const { port1, port2 } = new MessageChannel();
      navigator.serviceWorker.controller!.postMessage({ type: "port" }, [
        port2,
      ]);

      console.log(
        "service worker alive, loading %c patchwork system ",
        "background: #fff8f0; border: 1px solid; border-radius: 4px"
      );

      return { port: port1 };
    });
}
