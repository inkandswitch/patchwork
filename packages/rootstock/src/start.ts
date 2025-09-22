import * as Automerge from "@automerge/automerge";
import {
  AutomergeUrl,
  isValidAutomergeUrl,
  PeerId,
  Repo,
  StorageId,
  MessageChannelNetworkAdapter,
  IndexedDBStorageAdapter,
  WebSocketClientAdapter,
  Heads,
} from "@automerge/vanillajs";
import { ModuleWatcher } from "./modules";
import { KeyhiveNetworkAdapter } from "@automerge/automerge-keyhive-network-adapter";
import {
  generateDoc,
  getOrCreateAccountUrl,
  initializeKeyhive,
  KeyhiveKit,
} from "@patchwork/rootstock-identity";
import * as keyhive from "@keyhive/keyhive/slim";
// @ts-expect-error
import { wasmBase64 } from "@keyhive/keyhive/keyhive_wasm.base64.js";
import { setPanicHook } from "@keyhive/keyhive/slim";
keyhive.initFromBase64Wasm(wasmBase64);
console.log("Main thread: setting panic hook");
setPanicHook();
console.log("Main thread: panic hook set");

window.Automerge = Automerge;

declare global {
  interface Window {
    Automerge: typeof import("@automerge/automerge");
    repo: import("@automerge/automerge-repo").Repo;
    moduleWatcher: ModuleWatcher;
    keyhiveKit: KeyhiveKit;
  }
}

let globalMessageChannel: MessageChannel | undefined;
let globalMessageChannelAdapter: MessageChannelNetworkAdapter | undefined;
// global author for dochandle monkey patching
let globalAuthor: AutomergeUrl;

export interface RootstockOptions {
  serviceWorker: ServiceWorker;
  storageId?: StorageId;
  /**
   * Peer id prefix is added to both the peer id of the client and the service
   * worker to make it easier to grep for logs that are related to your own
   * changes / sync state
   */
  peerIdPrefix?: PeerId;
  moduleSettingsUrl?: AutomergeUrl;
}

declare global {
  interface Window {
    __ROOTSTOCK_VERSION__: {
      gitHash: string;
      buildTimestamp: number;
    };
  }
}

let started = false;
export default async function start(options: RootstockOptions) {
  if (started) {
    throw new Error("Rootstock is already started");
  }

  // This case should never happen
  // if the service worker is not defined here either the initialization failed
  // or we found a new case that we haven't considered yet
  if (!options.serviceWorker) {
    throw new Error("serviceWorker is a required option");
  }

  started = true;

  console.info(
    `Running commit ${window.__ROOTSTOCK_VERSION__?.gitHash}, built ${getRelativeTime(window.__ROOTSTOCK_VERSION__?.buildTimestamp)}`
  );

  const storageId =
    options.storageId ??
    import.meta.env.ROOTSTOCK_STORAGE_ID ??
    ("a565270c-bf7c-4df9-a531-f6be1d3152f0" as StorageId);

  // TODO(chee): will this come from your identity document?
  // const peerIdPrefix =
  //   options.peerIdPrefix ??
  //   import.meta.env.ROOTSTOCK_PEER_ID_PREFIX ??
  //   localStorage.getItem("PEER_ID_PREFIX");

  // TODO(chee): this will probably come from your identity document
  const moduleSettingsUrl =
    options.moduleSettingsUrl ??
    import.meta.env.ROOTSTOCK_MODULE_SETTINGS_URL ??
    localStorage.getItem("moduleSettingsUrl") ??
    ("automerge:3n51DZbA1FRwHAV8K2sW1g2aA3P2" as AutomergeUrl);

  if (!isValidAutomergeUrl(moduleSettingsUrl)) {
    throw new Error("Invalid module settings URL");
  }

  globalMessageChannel = new MessageChannel();
  globalMessageChannelAdapter = new MessageChannelNetworkAdapter(
    globalMessageChannel.port1
  );

  console.log("establishMessageChannel: initial startup");

  // Wait for service worker to signal it's ready
  const serviceWorkerReady = new Promise<void>((resolve) => {
    const handler = (event: MessageEvent) => {
      if (event.data.type === "SERVICE_WORKER_READY") {
        console.log("Service worker is ready");
        navigator.serviceWorker.removeEventListener("message", handler);
        resolve();
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
  });

  options.serviceWorker.postMessage(
    {
      type: "INIT",
    },
    [globalMessageChannel!.port2]
  );

  await serviceWorkerReady;

  // Service workers stop on their own, which breaks sync.
  // Here we ping the service worker while the tab is running
  // to keep it alive (and make it restart if it did stop.)
  setInterval(() => {
    options.serviceWorker.postMessage({ type: "PING" });
  }, 5000);

  const storage = new IndexedDBStorageAdapter();

  const { active, keyhive, peerId, syncServer } = await initializeKeyhive({
    storage,
    peerIdSuffix: Math.random().toString(36).slice(2),
    eventHandler: (event) => {
      console.log(`[Keyhive Event] ${event}`);
    },
  });

  const network = new KeyhiveNetworkAdapter(
    new WebSocketClientAdapter("wss://keyhive.sync.automerge.org"),
    keyhive,
    storage
  );

  const repo = new Repo({
    network: [network],
    storage,
    peerId,
    enableRemoteHeadsGossiping: true,
    idFactory: async (heads: Heads) => {
      // FIXME: Remove this "lock"
      const doc = await network.executeWithLock(async () => {
        return await generateDoc(keyhive);
      });
      return doc.doc_id.toBytes();
    },
  });
  window.repo = repo;
  // this is rootstock, replaces 'tinyEssayEditor:accountId'
  const accountUrl = await getOrCreateAccountUrl({ active, storage, repo });

  const keyhiveKit: KeyhiveKit = {
    accountUrl,
    active: active,
    keyhive: keyhive,
    syncServer: syncServer,
  };

  window.keyhiveKit = keyhiveKit;

  // we need to subscribe to the storage id of the sync server before we boot up patchwork
  // so we don't miss any remote heads updates
  // TODO: fix this in automerge-repo
  repo.subscribeToRemotes([storageId]);

  // Re-establish the MessageChannel if the controlling service worker changes.
  navigator.serviceWorker.addEventListener("controllerchange", (event) => {
    const newServiceWorker = (event.target as ServiceWorkerContainer)
      .controller!;
    // controllerchange is fired after a new service worker is installed
    // even if we wait above in setupServiceWorker() until the service worker state changes to activated.
    // To make sure we don't call establishMessageChannel twice check if this is actually a new service worker
    if (newServiceWorker !== options.serviceWorker) {
      console.log(
        "i should handle controllerchange to new service worker but i'm broken"
      );
    }
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    switch (event.data.type) {
      case "SERVICE_WORKER_RESTARTED":
        // Re-establish the MessageChannel if the service worker restarts
        console.log("i should handle service worker restart but i'm broken");
        break;
    }
  });

  const moduleWatcher = new ModuleWatcher(
    "automerge:3tEm1dky5xtZayjTxVWyMkCN43aj" as AutomergeUrl,
    [],
    repo
  );
  window.moduleWatcher = moduleWatcher;

  defineRootstockToolElement();

  return { repo, moduleWatcher, keyhiveKit };
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
