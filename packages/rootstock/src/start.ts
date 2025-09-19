import * as Automerge from "@automerge/automerge";
import {
  AutomergeUrl,
  DocHandle,
  isValidAutomergeUrl,
  PeerId,
  Repo,
  StorageId,
  UrlHeads,
  MessageChannelNetworkAdapter,
  IndexedDBStorageAdapter,
} from "@automerge/vanillajs";
import { ModuleWatcher } from "./modules";
import { getAccount } from "./account";

window.Automerge = Automerge;

declare global {
  interface Window {
    Automerge: typeof import("@automerge/automerge");
    repo: import("@automerge/automerge-repo").Repo;
    moduleWatcher: ModuleWatcher;
  }
}

let globalMessageChannelAdapter: MessageChannelNetworkAdapter | undefined;
// global author for dochandle monkey patching
let globalAuthor: AutomergeUrl;

export interface RootstockOptions {
  storageId?: StorageId;
  /**
   * Peer id prefix is added to both the peer id of the client and the service
   * worker to make it easier to grep for logs that are related to your own
   * changes / sync state
   */
  peerIdPrefix?: PeerId;
  moduleSettingsUrl?: AutomergeUrl;
  serviceWorkerUrl?: string;
}

let started = false;
export default async function start(options: RootstockOptions = {}) {
  if (started) {
    throw new Error("Rootstock is already started");
  }
  started = true;

  console.info(
    `Running commit ${window.__ROOTSTOCK_VERSION_?.gitHash}, built ${getRelativeTime(window.__ROOTSTOCK_VERSION_?.buildTimestamp)}`
  );

  const storageId =
    options.storageId ??
    import.meta.env.ROOTSTOCK_STORAGE_ID ??
    ("3760df37-a4c6-4f66-9ecd-732039a9385d" as StorageId);

  const peerIdPrefix =
    options.peerIdPrefix ??
    import.meta.env.ROOTSTOCK_PEER_ID_PREFIX ??
    localStorage.getItem("PEER_ID_PREFIX");

  const moduleSettingsUrl =
    options.moduleSettingsUrl ??
    import.meta.env.ROOTSTOCK_MODULE_SETTINGS_URL ??
    localStorage.getItem("moduleSettingsUrl") ??
    ("automerge:3n51DZbA1FRwHAV8K2sW1g2aA3P2" as AutomergeUrl);

  const serviceWorkerUrl =
    options.serviceWorkerUrl ??
    import.meta.env.ROOTSTOCK_SERVICE_WORKER_URL ??
    "/service-worker.js";

  if (!isValidAutomergeUrl(moduleSettingsUrl)) {
    throw new Error("Invalid module settings URL");
  }
  const serviceWorker = await setupServiceWorker(serviceWorkerUrl);
  const repo = await setupRepo({ peerIdPrefix });
  window.repo = repo;

  // we need to subscribe to the storage id of the sync server before we boot up patchwork
  // so we don't miss any remote heads updates
  // TODO: fix this in automerge-repo
  repo.subscribeToRemotes([storageId]);

  // Service workers stop on their own, which breaks sync.
  // Here we ping the service worker while the tab is running
  // to keep it alive (and make it restart if it did stop.)
  setInterval(() => {
    serviceWorker.postMessage({ type: "PING" });
  }, 5000);

  // This case should never happen
  // if the service worker is not defined here either the initialization failed
  // or we found a new case that we haven't considered yet
  if (!serviceWorker) {
    throw new Error("Failed to setup service worker");
  }

  console.log("establishMessageChannel: initial startup");
  establishMessageChannel({ serviceWorker, repo });

  // Re-establish the MessageChannel if the controlling service worker changes.
  navigator.serviceWorker.addEventListener("controllerchange", (event) => {
    const newServiceWorker = (event.target as ServiceWorkerContainer)
      .controller!;
    // controllerchange is fired after a new service worker is installed
    // even if we wait above in setupServiceWorker() until the service worker state changes to activated.
    // To make sure we don't call establishMessageChannel twice check if this is actually a new service worker
    if (newServiceWorker !== serviceWorker) {
      console.log(
        "establishMessageChannel: controllerchange to new service worker"
      );
      establishMessageChannel({ serviceWorker: newServiceWorker, repo });
    }
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    switch (event.data.type) {
      case "SERVICE_WORKER_RESTARTED":
        // Re-establish the MessageChannel if the service worker restarts
        console.log(
          "establishMessageChannel: SERVICE_WORKER_RESTARTED message"
        );
        establishMessageChannel({ serviceWorker, repo });
        break;
    }
  });

  await setupAccount({ repo });
  monkeyPatchDocHandle();

  const moduleWatcher = new ModuleWatcher(moduleSettingsUrl, [], repo);
  window.moduleWatcher = moduleWatcher;

  defineRootstockToolElement();

  return { repo, moduleWatcher };
}

async function setupAccount(options: { repo: Repo }) {
  const account = await getAccount(options.repo);
  globalAuthor = account.contactHandle.url;

  account.on("change", () => {
    globalAuthor = account.contactHandle.url;
  });

  return account;
}

async function setupServiceWorker(
  serviceWorkerUrl: string
): Promise<ServiceWorker> {
  return navigator.serviceWorker
    .register(serviceWorkerUrl)
    .then((registration) => {
      // If the service worker is still installing, we wait until it is activated
      const installing = registration.installing;
      if (installing) {
        console.log("spawing new service worker");
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
}

async function setupRepo(options: { peerIdPrefix?: string } = {}) {
  if (options.peerIdPrefix) {
    console.log("Using peer id prefix: ", options.peerIdPrefix);
  }

  // We create a repo without any network adapters.
  // Later we connect the repo with the repo in the service worker through a message channel
  const peerId = "frontend-" + Math.round(Math.random() * 10000);

  const repo = new Repo({
    storage: new IndexedDBStorageAdapter(),
    network: [],
    peerId: (options.peerIdPrefix
      ? `patchwork-${options.peerIdPrefix}-${peerId}`
      : peerId) as PeerId,
    sharePolicy: async (peerId) => peerId.includes("service-worker"),
    // We need to enable remote heads gossiping so the remote heads of the sync server
    // are forwarded from the service worker to the repo here in the main thread
    enableRemoteHeadsGossiping: true,
  });

  return repo;
}

// Connects the repo in the tab with the repo in the service worker through a message channel.
// The repo in the tab takes advantage of loaded state in the SW.
// With the init message we also pass the config for initializing the repo. The config only
// takes effect if the service worker hasn't been initialized before
function establishMessageChannel(options: {
  serviceWorker: ServiceWorker;
  repo: Repo;
}) {
  // Send one side of a MessageChannel to the service worker and register the other with the repo.
  const messageChannel = new MessageChannel();

  if (globalMessageChannelAdapter) {
    options.repo.networkSubsystem.removeNetworkAdapter(
      globalMessageChannelAdapter
    );
  }
  globalMessageChannelAdapter = new MessageChannelNetworkAdapter(
    messageChannel.port1
  );
  options.repo.networkSubsystem.addNetworkAdapter(globalMessageChannelAdapter);
  options.serviceWorker.postMessage(
    {
      type: "INIT",
    },
    [messageChannel.port2]
  );

  console.log("Connected to service worker");
}

/** Here we monkey patch the DocHandle to
 *  always add the currently logged in user as author
 *  and the current timestamp as metadata to each change.
 *
 *  Eventually, we would like to ship this functionality directly
 *  inside automerge-repo, but that's currently blocked on having a
 *  more efficient approach to storing change metadata in Automerge.
 *
 *  Once that's done we should remove this monkey patch.
 */
function monkeyPatchDocHandle() {
  const oldChange = DocHandle.prototype.change;
  DocHandle.prototype.change = function <T>(
    callback: Automerge.ChangeFn<T>,
    options: Automerge.ChangeOptions<T> = {}
  ) {
    const optionsWithAttribution: Automerge.ChangeOptions<T> = {
      time: Date.now(),
      message: JSON.stringify({ author: globalAuthor }),
      ...options,
    };
    oldChange.call(
      this,
      callback,
      optionsWithAttribution as Automerge.ChangeOptions<any>
    );
  };

  const oldChangeAt = DocHandle.prototype.changeAt;
  DocHandle.prototype.changeAt = function <T>(
    heads: UrlHeads,
    callback: Automerge.ChangeFn<T>,
    options: Automerge.ChangeOptions<T> = {}
  ) {
    const optionsWithAttribution: Automerge.ChangeOptions<T> = {
      time: Date.now(),
      message: JSON.stringify({ author: globalAuthor }),
      ...options,
    };
    return oldChangeAt.call(
      this,
      heads,
      callback,
      optionsWithAttribution as Automerge.ChangeOptions<any>
    );
  };
}

async function defineRootstockToolElement() {
  // Register the custom element in a try/catch for HMR support
  try {
    const { RootstockTool } = await import("./elements/rootstock-tool");
    if (!customElements.get("rootstock-tool")) {
      customElements.define("rootstock-tool", RootstockTool);
      console.log("Registered rootstock-tool custom element");
    }
  } catch (err) {
    console.warn("Failed to register rootstock-tool custom element:", err);
  }
}

function getRelativeTime(timestampMs: number): string {
  const nowUtc = Date.now();
  const diffMs = nowUtc - timestampMs;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return diffSeconds <= 1 ? "just now" : `${diffSeconds} seconds ago`;
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return "yesterday";
  } else {
    return `${diffDays} days ago`;
  }
}
