import type {
  HandoffHandler,
  HandoffRequestMessage,
  HandoffResponse,
  SetupServiceWorkerOptions,
} from "./types.js";

const key = "patchworkServiceWorkerCacheVersion";

function bumpServiceWorkerCacheVersion() {
  const version = new Date() + "@main";
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

const encoder = new TextEncoder();
export default async function setupServiceWorker(
  handler: HandoffHandler,
  options?: SetupServiceWorkerOptions
) {
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    console.log(
      "%cnew service worker, reloading",
      "color: pink; font-weight: bold"
    );
    bumpServiceWorkerCache(navigator.serviceWorker.controller);
    location.reload();
  });

  navigator.serviceWorker.addEventListener("message", async (event) => {
    if (event.data.type == "request") {
      const requestMessage: HandoffRequestMessage = event.data;
      const source = event.source;

      if (!source) {
        throw new TypeError("can't operate without a source");
      }

      async function send(
        response: HandoffResponse,
        transfer?: Transferable[]
      ) {
        source!.postMessage(
          {
            id: requestMessage.id,
            type: "response",
            response,
          },
          { transfer }
        );
      }

      const handoffResponse = await handler(
        requestMessage.request.url,
        requestMessage.request
      );

      if (!handoffResponse) {
        return source?.postMessage({ id: requestMessage.id, type: "response" });
      }

      if (typeof handoffResponse == "string") {
        const bytes = encoder.encode(handoffResponse);
        return send({ body: bytes }, [bytes.buffer]);
      }

      if (handoffResponse instanceof Uint8Array) {
        return send({ body: handoffResponse }, [handoffResponse.buffer]);
      }

      const { body: handoffBody, headers, status, cache } = handoffResponse;

      const body =
        typeof handoffBody == "string"
          ? encoder.encode(handoffBody)
          : handoffBody;

      send(
        { body, headers, status, cache },
        body instanceof Uint8Array ? [body.buffer] : undefined
      );
    }
  });

  const existingSw = await navigator.serviceWorker.getRegistration();

  return navigator.serviceWorker
    .register(options?.path ?? "/service-worker.js")
    .then(async (sw) => {
      if (!existingSw?.active) {
        bumpServiceWorkerCache(sw.installing);
        queueMicrotask(() => location.reload());
        return sw.active!;
      }
      sw.active && setServiceWorkerCacheName(sw.active);
      console.log(
        "service worker alive, loading %c patchwork system ",
        "background: #fff8f0; border: 1px solid; border-radius: 4px"
      );
    });
}
