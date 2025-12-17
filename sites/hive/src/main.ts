import {
  createFilesystemHandoffHandler,
  ModuleWatcher,
} from "@inkandswitch/patchwork-filesystem";

import { registerPlugins } from "@inkandswitch/patchwork-plugins";
import {
  IndexedDBStorageAdapter,
  Repo,
  WebSocketClientAdapter,
  type AutomergeUrl,
} from "@automerge/vanillajs";
import { registerPatchworkViewElement } from "@inkandswitch/patchwork-elements";
import { initializeAutomergeRepoKeyhive, initKeyhiveWasm, setPanicHook } from "@automerge/automerge-repo-keyhive";
import * as Automerge from "@automerge/automerge";
import * as AutomergeRepo from "@automerge/automerge-repo";
import bootstrap from "@inkandswitch/patchwork-bootloader";

initKeyhiveWasm()
setPanicHook()

const storage = new IndexedDBStorageAdapter("hive");
const network = new WebSocketClientAdapter("wss://keyhive.sync.automerge.org");
const hive = await initializeAutomergeRepoKeyhive({
  storage,
  peerIdSuffix: "hivework" + Math.random().toString(36).slice(2),
  networkAdapter: network,
  automaticArchiveIngestion: true,
  onlyShareWithHardcodedServerPeerId: true,
});

const repo = new Repo({
  storage: new IndexedDBStorageAdapter(),
  network: [hive.networkAdapter],
  peerId: hive.peerId,
  idFactory: hive.idFactory,
});

declare global {
  interface Window {
    Automerge: typeof import("@automerge/automerge");
    AutomergeRepo: typeof import("@automerge/automerge-repo");
    repo: Repo;
    hive: typeof hive;
  }
}

window.repo = repo;
window.Automerge = Automerge;
window.AutomergeRepo = AutomergeRepo;
window.hive = hive;

const handlers = {
  "automerge:": createFilesystemHandoffHandler(repo),
} as const;

bootstrap(async (href, request) =>
  handlers[new URL(href).protocol as keyof typeof handlers]?.(href, request)
);

const moduleWatcher = new ModuleWatcher(
  "automerge:3n51DZbA1FRwHAV8K2sW1g2aA3P2" as AutomergeUrl,
  [],
  repo,
  (name, mod) => {
    Array.isArray(mod.plugins) && registerPlugins(mod.plugins, name);
  }
);

const params = new URLSearchParams(document.location.search);

registerPatchworkViewElement({
  moduleWatcher,
  repo,
  hive,
});

const docUrl = params.get("docUrl");
const toolId = params.get("toolId");
const modules = params.getAll("loadModules");
await moduleWatcher.loadModules(modules);

if (!toolId) {
  throw new Error("need docUrl and toolId query params");
}

const rootElement = document.getElementById("root")!;

async function getOrCreateAccountUrl() {
  const existing = localStorage.getItem("hiveAccountUrl") as
    | AutomergeUrl
    | undefined;
  if (existing) return existing;
  const account = await repo.create2({ id: hive?.active.peerId ?? null });
  localStorage.setItem("patchworkAccountUrl", account.url);
  return account.url;
}
const accountUrl = await getOrCreateAccountUrl();

rootElement.setAttribute("doc-url", docUrl ?? accountUrl);
toolId && rootElement.setAttribute("tool-id", toolId);
