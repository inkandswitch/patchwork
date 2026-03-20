import "./global.css";
import { registerPatchworkViewElement } from "@inkandswitch/patchwork-elements";
import setup from "@inkandswitch/patchwork-bootloader";
import {
  IndexedDBStorageAdapter,
  MessageChannelNetworkAdapter,
  Repo,
} from "@automerge/vanillajs";
import * as Automerge from "@automerge/automerge";
import * as AutomergeRepo from "@automerge/automerge-repo";
// @ts-expect-error there ain't no types for tenfold
import * as tenfold from "@inkandswitch/tenfold";
import "@inkandswitch/tenfold/style.css";

import { registerPlugins, getRegistry } from "@inkandswitch/patchwork-plugins";

const url = URL.createObjectURL(
  new Blob(["console.log('hehe')"], { type: "application/javascript" })
);

registerPlugins(tenfold.plugins, url);
(window as any).tools = getRegistry("patchwork:tool");

declare global {
  interface Window {
    Automerge: typeof import("@automerge/automerge");
    AutomergeRepo: typeof import("@automerge/automerge-repo");
    repo: Repo;
  }
}

const repo = new Repo({
  storage: new IndexedDBStorageAdapter(),
  async sharePolicy(peerId) {
    return peerId.includes("service-worker");
  },
});

const result = await setup({
  syncServer: "wss://sync.tenfold.inkandswitch.com",
});
if (!result) {
  throw new Error("Failed to set up service worker");
}

repo.networkSubsystem.addNetworkAdapter(
  new MessageChannelNetworkAdapter(result.port)
);
await repo.networkSubsystem.whenReady();

window.repo = repo;
window.Automerge = Automerge;
window.AutomergeRepo = AutomergeRepo;
await repo.flush();
registerPatchworkViewElement({ repo });

const rootElement = document.getElementById("root")!;
rootElement.addEventListener(
  "patchwork:mounted",
  () => {
    rootElement.classList.add("mounted");
  },
  { once: true }
);
const doc = new URLSearchParams(window.location.search).get("doc");
if (doc) {
  localStorage.setItem("tenfold", doc);
  rootElement.setAttribute("tool-id", "inkandswitch/tenfold");
  rootElement.setAttribute("doc-url", doc);
} else {
  const saved = localStorage.getItem("tenfold");
  if (saved) {
    const url = new URL(window.location.href);
    url.searchParams.set("doc", saved);
    window.location.href = url.toString();
  } else {
    const handle = await repo.create2({
      "@patchwork": { type: "tenfriend" },
    });
    rootElement.setAttribute("tool-id", "tenfriend");
    rootElement.setAttribute("doc-url", handle.url);
  }
}
