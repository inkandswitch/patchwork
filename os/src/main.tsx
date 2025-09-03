import * as Automerge from "@automerge/automerge";
import ReactDom from "react-dom/client";
import {
  AutomergeUrl,
  DocHandle,
  PeerId,
  Repo,
  StorageId,
  UrlHeads,
} from "@automerge/automerge-repo";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";

import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { getAccount } from "@patchwork/sdk";
import { ModuleWatcherProvider } from "./useModuleWatcher.js";
import { getRelativeTime } from "./getRelativeTime.js";

import "./index.css";

const AUTOMERGE_SYNC_SERVER_STORAGE_ID = (import.meta.env
  ?.VITE_SYNC_SERVER_STORAGE_ID ??
  "3760df37-a4c6-4f66-9ecd-732039a9385d") as StorageId;

// Peer id prefix is added to both the peer id of the client and the service worker
// to make it easier to grep for logs that are related to your own changes / sync state
const PEER_ID_PREFIX = localStorage.getItem("PEER_ID_PREFIX");

console.log(
  `Running commit ${__PATCHWORK_VERSION__.gitHash}, built ${getRelativeTime(__PATCHWORK_VERSION__.buildTimestamp)}`
);

const serviceWorker = await setupServiceWorker();

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

const repo = await setupRepo();
let globalMessageChannelAdapter: MessageChannelNetworkAdapter | undefined;

console.log("establishMessageChannel: initial startup");
establishMessageChannel(serviceWorker);

async function setupServiceWorker(): Promise<ServiceWorker> {
  return navigator.serviceWorker
    .register("/service-worker.js")
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

async function setupRepo() {
  if (PEER_ID_PREFIX) {
    console.log("Using peer id prefix: ", PEER_ID_PREFIX);
  }

  // We create a repo without any network adapters.
  // Later we connect the repo with the repo in the service worker through a message channel
  const peerId = "frontend-" + Math.round(Math.random() * 10000);

  const repo = new Repo({
    storage: new IndexedDBStorageAdapter(),
    network: [],
    peerId: (PEER_ID_PREFIX
      ? `patchwork-${PEER_ID_PREFIX}-${peerId}`
      : peerId) as PeerId,
    sharePolicy: async (peerId) => peerId.includes("service-worker"),
    // We need to enable remote heads gossiping so the remote heads of the sync server
    // are forwarded from the service worker to the repo here in the main thread
    enableRemoteHeadsGossiping: true,
  });

  return repo;
}

// Re-establish the MessageChannel if the controlling service worker changes.
navigator.serviceWorker.addEventListener("controllerchange", (event) => {
  const newServiceWorker = (event.target as ServiceWorkerContainer).controller!;
  // controllerchange is fired after a new service worker is installed
  // even if we wait above in setupServiceWorker() until the service worker state changes to activated.
  // To make sure we don't call establishMessageChannel twice check if this is actually a new service worker
  if (newServiceWorker !== serviceWorker) {
    console.log(
      "establishMessageChannel: controllerchange to new service worker"
    );
    establishMessageChannel(newServiceWorker);
  }
});

navigator.serviceWorker.addEventListener("message", (event) => {
  switch (event.data.type) {
    case "SERVICE_WORKER_RESTARTED":
      // Re-establish the MessageChannel if the service worker restarts
      console.log("establishMessageChannel: SERVICE_WORKER_RESTARTED message");
      establishMessageChannel(serviceWorker);
      break;
  }
});

// Connects the repo in the tab with the repo in the service worker through a message channel.
// The repo in the tab takes advantage of loaded state in the SW.
// With the init message we also pass the config for initializing the repo. The config only
// takes effect if the service worker hasn't been initialized before
function establishMessageChannel(serviceWorker: ServiceWorker) {
  // Send one side of a MessageChannel to the service worker and register the other with the repo.
  const messageChannel = new MessageChannel();

  if (globalMessageChannelAdapter) {
    repo.networkSubsystem.removeNetworkAdapter(globalMessageChannelAdapter);
  }
  globalMessageChannelAdapter = new MessageChannelNetworkAdapter(
    messageChannel.port1
  );
  repo.networkSubsystem.addNetworkAdapter(globalMessageChannelAdapter);
  serviceWorker.postMessage(
    {
      type: "INIT",
    },
    [messageChannel.port2]
  );

  console.log("Connected to service worker");
}

// Setup account & code loader
let author: AutomergeUrl;

async function setupAccount() {
  const account = await getAccount(repo);
  author = account.contactHandle.url;

  account.on("change", () => {
    author = account.contactHandle.url;
  });

  return account;
}
const account = await setupAccount();

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
const oldChange = DocHandle.prototype.change;
DocHandle.prototype.change = function <T>(
  callback: Automerge.ChangeFn<T>,
  options: Automerge.ChangeOptions<T> = {}
) {
  const optionsWithAttribution: Automerge.ChangeOptions<T> = {
    time: Date.now(),
    message: JSON.stringify({ author }),
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
    message: JSON.stringify({ author }),
    ...options,
  };
  return oldChangeAt.call(
    this,
    heads,
    callback,
    optionsWithAttribution as Automerge.ChangeOptions<any>
  );
};

// @ts-expect-error - adding property to window
window.Automerge = Automerge;

// @ts-expect-error - adding property to window
window.repo = repo;

// we need to subscribe to the storage id of the sync server before we boot up patchwork
// so we don't miss any remote heads updates
// TODO: fix this in automerge-repo
repo.subscribeToRemotes([AUTOMERGE_SYNC_SERVER_STORAGE_ID]);

// Register the custom element in a try/catch for HMR support
try {
  const { PatchworkEmbed } = await import("@patchwork/sdk/embed");
  if (!customElements.get("patchwork-embed")) {
    customElements.define("patchwork-embed", PatchworkEmbed);
    console.log("Registered patchwork-embed custom element");
  }
} catch (err) {
  console.warn("Failed to register patchwork-embed custom element:", err);
}

const params = new URLSearchParams(document.location.search);
const docUrl = params.get("docUrl");

if (!docUrl) throw new Error("Need a docUrl for now");

export const Root = () => (
  <RepoContext.Provider value={repo}>
    <ModuleWatcherProvider account={account} repo={repo}>
      <patchwork-embed doc-url={docUrl} className="w-full h-full" />
    </ModuleWatcherProvider>
  </RepoContext.Provider>
);

ReactDom.createRoot(document.getElementById("root")!).render(<Root />);
