import {
  IndexedDBStorageAdapter,
  MessageChannelNetworkAdapter,
  Repo,
  WebSocketClientAdapter,
  type PeerId,
  type StorageAdapterInterface,
  type StorageId,
} from "@automerge/vanillajs";

import type { initializeKeyhive } from "@automerge/automerge-repo-keyhive";

export type AutomergeRepoKeyhive = Awaited<
  ReturnType<typeof initializeKeyhive>
>;

// will be replaced during build
declare global {
  var __SYNC_SERVER_URL__: string;
  var __SYNC_SERVER_STORAGE_ID__: StorageId;
  var __SERVICE_WORKER_PATH__: string;
  var __SERVICE_WORKER_TYPE__: WorkerType;
  var __KEYHIVE_ENABLED__: boolean;
  var repo: Repo;
}

export async function installServiceWorker(): Promise<ServiceWorker> {
  const sw: ServiceWorker = await navigator.serviceWorker
    .register(__SERVICE_WORKER_PATH__, { type: __SERVICE_WORKER_TYPE__ })
    .then((registration) => {
      // If the service worker is still installing, we wait until it is activated
      const installing = registration.installing;
      if (installing) {
        console.log("%c spawing new service worker", "color: pink");
        return new Promise((resolve) => {
          installing.onstatechange = (event) => {
            const serviceWorker = event.target as ServiceWorker;
            if (serviceWorker.state === "activated") {
              resolve(serviceWorker);
            }
          };
        });
      }

      // otherwise return the active service worker
      // TODO: JAH strict fix... docs suggest there are more states than just installing and active
      return registration.active!;
    });

  // Service workers stop on their own, which breaks sync.
  // Here we ping the service worker while the tab is running
  // to keep it alive (and make it restart if it did stop.)
  setInterval(() => {
    sw.postMessage({ type: "PING" });
  }, 5000);

  return sw;
}

export async function createRepo(storage: StorageAdapterInterface) {
  const peerIdSuffix =
    `patchwork-${Math.random().toString(36).slice(2)}` as PeerId;
  const hive = await (async function () {
    if (!__KEYHIVE_ENABLED__) return;

    const keyhive = await import("@keyhive/keyhive/slim");

    const { wasmBase64 } = await import(
      // @ts-expect-error
      "@keyhive/keyhive/keyhive_wasm.base64.js"
    );
    keyhive.initFromBase64Wasm(wasmBase64);
    keyhive.setPanicHook();

    const ws = new WebSocketClientAdapter(__SYNC_SERVER_URL__);

    const { initializeKeyhive: initializeAutomergeRepoKeyhive } = await import(
      "@automerge/automerge-repo-keyhive"
    );

    const hive = await initializeAutomergeRepoKeyhive({
      storage,
      peerIdSuffix,
      networkAdapter: ws,
      automaticArchiveIngestion: true,
    });

    return hive;
  })();

  const peerId = hive ? hive.peerId : peerIdSuffix;

  const repo = new Repo({
    network: hive ? [hive.networkAdapter] : [],
    storage,
    peerId,
    enableRemoteHeadsGossiping: true,
    idFactory: hive?.idFactory,
  });

  self.repo = repo;

  // we need to subscribe to the storage id of the sync server before we boot up patchwork
  // so we don't miss any remote heads updates
  // TODO: fix this in automerge-repo
  repo.subscribeToRemotes([__SYNC_SERVER_STORAGE_ID__]);

  return { repo, hive } as const;
}

let globalMessageChannelAdapter: MessageChannelNetworkAdapter | undefined;

// Connects the repo in the tab with the repo in the service worker through a message channel.
// The repo in the tab takes advantage of loaded state in the SW.
// With the init message we also pass the config for initializing the repo. The config only
// takes effect if the service worker hasn't been initialized before
export function connectServiceWorkerToRepo(
  serviceWorker: ServiceWorker,
  repo: Repo
) {
  // Send one side of a MessageChannel to the service worker and register the other with the repo.
  const messageChannel = new MessageChannel();

  if (globalMessageChannelAdapter) {
    repo.networkSubsystem.removeNetworkAdapter(globalMessageChannelAdapter);
  }
  globalMessageChannelAdapter = new MessageChannelNetworkAdapter(
    messageChannel.port1
  );
  repo.networkSubsystem.addNetworkAdapter(globalMessageChannelAdapter);
  serviceWorker.postMessage({ type: "INIT" }, [messageChannel.port2]);
  console.log("%c Connected to service worker", "color: blue");
}

export default async function bootstrap(): Promise<{
  repo: Repo;
  hive?: AutomergeRepoKeyhive;
}> {
  let sw = await installServiceWorker();
  const storage = new IndexedDBStorageAdapter();
  const { repo, hive } = await createRepo(storage);
  const { promise: serviceWorkerInitEcho, resolve } =
    Promise.withResolvers<void>();

  // TODO(chee)<2025-10-06>: due to issues identified when using keyhive with
  // the messagechannel we connect to the sync server directly when using keyhive in the main thread
  if (!hive) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      switch ((event as MessageEvent).data.type) {
        case "SERVICE_WORKER_RESTARTED":
          // Re-establish the MessageChannel if the service worker restarts
          console.log(
            "establishMessageChannel: SERVICE_WORKER_RESTARTED message"
          );
          connectServiceWorkerToRepo(sw, repo);
          break;
        case "SERVICE_WORKER_READY":
          resolve();
          break;
      }
    });

    // Re-establish the MessageChannel if the controlling service worker changes.
    navigator.serviceWorker.addEventListener("controllerchange", (event) => {
      const newServiceWorker = (event.target as ServiceWorkerContainer)
        .controller!;
      // controllerchange is fired after a new service worker is installed
      // even if we wait above in setupServiceWorker() until the service worker state changes to activated.
      // To make sure we don't call establishMessageChannel twice check if this is actually a new service worker
      if (newServiceWorker !== sw) {
        console.log(
          "establishMessageChannel: controllerchange to new service worker"
        );
        sw = newServiceWorker;
        connectServiceWorkerToRepo(newServiceWorker, repo);
      }
    });

    connectServiceWorkerToRepo(sw, repo);
    await serviceWorkerInitEcho;
  }

  return { repo, hive };
}
