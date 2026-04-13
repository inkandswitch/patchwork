import "./global.css";

// Side-effect import: initializes the Subduction Wasm module (via initSync)
// before the Repo constructor accesses it (subduction-aware automerge-repo
// calls into subduction WASM on construction, e.g., set_subduction_logger).
import "@automerge/automerge-subduction";

import {
  registerPatchworkViewElement,
  openDocument,
} from "@inkandswitch/patchwork-elements";
import { ModuleWatcher } from "@inkandswitch/patchwork-filesystem";
import setup from "@inkandswitch/patchwork-bootloader";
import {
  registerPlugins,
  DatatypeDescription,
  DatatypeImplementation,
  getRegistry,
} from "@inkandswitch/patchwork-plugins";
import * as plugins from "@inkandswitch/patchwork-plugins";
import {
  getOrCreateLayoutDocHandle,
  TinyPatchworkLayoutDoc,
} from "./layout-doc";
import {
  DocHandle,
  IndexedDBStorageAdapter,
  isValidAutomergeUrl,
  isValidDocumentId,
  MessageChannelNetworkAdapter,
  parseAutomergeUrl,
  Repo,
  stringifyAutomergeUrl,
  type UrlHeads,
} from "@automerge/vanillajs";
import * as Automerge from "@automerge/automerge";
import * as AutomergeRepo from "@automerge/automerge-repo";
import { initializeAutomergeRepoKeyhive, initKeyhiveWasm } from "@automerge/automerge-repo-keyhive";

initKeyhiveWasm();

// Side-effect import: initializes the Subduction Wasm module (via initSync)
// before the Repo constructor accesses it. The Vite alias ensures this resolves
// to the same underlying module as @automerge/automerge-subduction/slim.
import "@automerge/automerge-subduction";

const result = await setup({
  subductionEndpoints: ["ws://localhost:3035"],
  siteName: "gaios",
});
if (!result) {
  throw new Error("Failed to set up service worker");
}

const keyhiveStorage = new IndexedDBStorageAdapter("gaios-keyhive");
const hive = await initializeAutomergeRepoKeyhive({
  storage: keyhiveStorage,
  peerIdSuffix: "gaios" + Math.random().toString(36).slice(2),
  networkAdapter: new MessageChannelNetworkAdapter(result.port),
  automaticArchiveIngestion: true,
  cachingMode: "periodic",
  onlyShareWithHardcodedServerPeerId: false,
});

declare global {
  interface Window {
    accountDocHandle: DocHandle<TinyPatchworkLayoutDoc>;
    Automerge: typeof import("@automerge/automerge");
    AutomergeRepo: typeof import("@automerge/automerge-repo");
    repo: Repo;
    hive: typeof hive;
    getRepoChannel: () => MessagePort;
    patchwork: {
      repo: Repo;
      modules: ModuleWatcher;
      plugins: typeof plugins;
      accountDocHandle: DocHandle<TinyPatchworkLayoutDoc>;
    };
  }
}

const repo = new Repo({
  storage: new IndexedDBStorageAdapter(),
  enableRemoteHeadsGossiping: true,
  network: [hive.networkAdapter],
  peerId: hive.peerId,
  idFactory: hive.idFactory,
});

repo.subscribeToRemotes([
  "3760df37-a4c6-4f66-9ecd-732039a9385d" as import("@automerge/automerge-repo").StorageId,
]);

window.repo = repo;
window.hive = hive;
window.Automerge = Automerge;
window.AutomergeRepo = AutomergeRepo;

window.getRepoChannel = () => {
  const { port1, port2 } = new MessageChannel();
  navigator.serviceWorker.controller!.postMessage({ type: "port" }, [port2]);
  return port1;
};

// Wait for the network adapter to connect to the SW, but don't block forever.
// On a fresh profile, docs need the network (nothing in local storage).
await Promise.race([
  repo.networkSubsystem.whenReady(),
  new Promise((resolve) => setTimeout(resolve, 10_000)),
]);
(hive.networkAdapter as any).syncKeyhive?.();

const accountDocHandle = await getOrCreateLayoutDocHandle(repo, hive);
await repo.flush();

window.accountDocHandle = accountDocHandle;

// When keyhive events arrive from the service worker, the server connection
// is working. Reset the ModuleWatcher retry budget so it can recover from
// failures that occurred while the connection was down.
(hive.networkAdapter as any).on("ingest-remote", () => {
  moduleWatcher.resetRetries();
});

registerPatchworkViewElement({ repo, hive });

const rootElement = document.getElementById("root")!;

const initialParams = new URLSearchParams(location.hash.slice(1));
if (initialParams.has("frame")) {
  rootElement.setAttribute("tool-id", initialParams.get("frame")!);
  const docId = initialParams.get("doc");
  const docUrl = docId
    ? stringifyAutomergeUrl({ documentId: docId as import("@automerge/automerge-repo").DocumentId })
    : accountDocHandle.url;
  rootElement.setAttribute("doc-url", docUrl);
} else {
  rootElement.setAttribute("doc-url", accountDocHandle.url);
  rootElement.setAttribute("tool-id", accountDocHandle.doc().frameToolId);
}

rootElement.addEventListener("patchwork:open-document", async (event) => {
  const params = new URLSearchParams();
  const { url, toolId, type, title } = event.detail;
  const { documentId, heads } = parseAutomergeUrl(url);
  params.set("doc", documentId);
  if (heads) params.set("heads", heads?.join("|"));
  if (toolId) params.set("tool", toolId);
  if (title) params.set("title", title);
  if (type) {
    params.set("type", type);
  }
  window.location.hash = params.toString();

  try {
    const docHandle = await repo.find(
      stringifyAutomergeUrl({ documentId, heads })
    );
    const doc = docHandle.doc();
    const docType = type || doc?.["@patchwork"]?.type;
    if (docType) {
      const registry = getRegistry<DatatypeDescription>("patchwork:datatype");
      const datatype = await registry.load(docType);
      if (datatype) {
        const docTitle = (datatype.module as DatatypeImplementation).getTitle(
          doc
        );
        if (docTitle) {
          document.title = `${docTitle} | GAIOS`;
        }
      }
    }
  } catch (e) {
    console.error("Failed to update document title", e);
  }
});

rootElement.addEventListener("patchwork:mounted", () => {
  handleHashChange();
});

const moduleWatcher = new ModuleWatcher(
  repo,
  [
    accountDocHandle.doc().moduleSettingsUrl,
    // default tools for gaios
    "automerge:4KfgQruv1vSsGdWEzemXh4CoewX4" as AutomergeRepo.AutomergeUrl,
  ],
  (name, mod) => {
    if (Array.isArray(mod.plugins)) {
      // TODO: maybe get rid of this check?
      if (isValidAutomergeUrl(name)) {
        registerPlugins(mod.plugins, name);
      }
    }
  }
);

window.patchwork = { repo, modules: moduleWatcher, plugins, accountDocHandle };

rootElement.addEventListener("patchwork:no-tool", (event) => {
  moduleWatcher.loadSuggestedImportUrl(event.detail.url);
});

const bigPatchworkHashRegex =
  /(?<title>[A-Za-z0-9-]+)--(?<docId>[1-9A-HJ-NP-Za-km-z]+)(?<type>\?=[^&?]+)?/;

const handleHashChange = async () => {
  const hash = window.location.hash.slice(1);
  const legacy = bigPatchworkHashRegex.exec(hash);

  if (legacy) {
    const documentId = legacy.groups?.docId;
    if (isValidDocumentId(documentId)) {
      openDocument(rootElement, stringifyAutomergeUrl({ documentId }));
    }
    return;
  }
  const params = new URLSearchParams(hash);
  const frame = params.get("frame");
  if (frame) {
    const docUrl = params.get("doc") ?? accountDocHandle.url;
    if (
      rootElement.getAttribute("tool-id") !== frame ||
      rootElement.getAttribute("doc-url") !== docUrl
    ) {
      rootElement.setAttribute("tool-id", frame);
      rootElement.setAttribute("doc-url", docUrl);
    }
  }
  const documentId = params.get("doc");
  const heads = params.get("heads")?.split("|") as UrlHeads | undefined;
  const toolId = params.get("tool");
  const title = params.get("title");
  const type = params.get("type");
  if (isValidDocumentId(documentId)) {
    rootElement.dispatchEvent(
      new CustomEvent("patchwork:open-document", {
        detail: {
          url: stringifyAutomergeUrl({ documentId, heads }),
          toolId,
          title,
          type,
        },
      })
    );
  }
};

// Listen for hash changes and interpret them as Automerge URLs
window.addEventListener("hashchange", () => {
  handleHashChange();
});
