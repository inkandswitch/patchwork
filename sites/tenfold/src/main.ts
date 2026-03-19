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
  enableRemoteHeadsGossiping: true,
});

repo.subscribeToRemotes([
  "3760df37-a4c6-4f66-9ecd-732039a9385d" as import("@automerge/automerge-repo").StorageId,
]);

const result = await setup();
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
const doc = new URLSearchParams(window.location.search).get("doc");
if (doc) {
  rootElement.setAttribute("tool-id", "inkandswitch/tenfold");
  rootElement.setAttribute("doc-url", doc);
} else {
  rootElement.textContent = "YOU DO NEED THAT ?doc= BTW";
}
