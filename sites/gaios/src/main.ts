import "./global.css";

import {
  registerPatchworkViewElement,
  registerPatchworkToolPickerElement,
  openDocument,
} from "@inkandswitch/patchwork-elements";
import {
  ModuleWatcher,
  createFilesystemHandoffHandler,
  automergeUrlToServiceWorkerUrl,
} from "@inkandswitch/patchwork-filesystem";
import setup from "@inkandswitch/patchwork-bootloader";
import {
  registerPlugins,
  DatatypeDescription,
  DatatypeImplementation,
  getRegistry,
} from "@inkandswitch/patchwork-plugins";
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
import { SubductionStorageBridge } from "@automerge/automerge-repo-subduction-bridge";
import initSubduction, {
  Subduction,
  WebCryptoSigner,
} from "@automerge/automerge_subduction";
import * as subductionModule from "@automerge/automerge_subduction";
import { initSubductionModule } from "@automerge/automerge-repo-subduction-bridge";

declare global {
  interface Window {
    accountDocHandle: DocHandle<TinyPatchworkLayoutDoc>;
    Automerge: typeof import("@automerge/automerge");
    AutomergeRepo: typeof import("@automerge/automerge-repo");
    repo: Repo;
    getRepoChannel: () => MessagePort;
  }
}

const workerLogChannel = new BroadcastChannel("automerge-worker-logs");
workerLogChannel.onmessage = (event) => {
  const { level, args } = event.data;
  const method = level in console ? level : "log";
  (console as any)[method](...args);
};

// Initialize Subduction (shares IndexedDB storage with SharedWorker)
// Tab handles local operations; SharedWorker handles server sync
await initSubduction();
initSubductionModule(subductionModule);

const signer = await WebCryptoSigner.setup();
const storageAdapter = new IndexedDBStorageAdapter();
const storage = new SubductionStorageBridge(storageAdapter);
const subduction = await Subduction.hydrate(signer, storage);

// Tab's Subduction does NOT connect to server — worker handles that
// This avoids duplicate connections while sharing the same storage

const repo = new Repo({ subduction });

function createSharedWorker() {
  return new SharedWorker(new URL("./automerge-worker.ts", import.meta.url), {
    type: "module",
    name: "automerge-repo-shared-worker",
  });
}

function getRepoChannel() {
  try {
    const worker = createSharedWorker();
    return worker.port;
  } catch (error) {
    console.error(error);
    console.error("Falling back to tab-only repo strategy");
    const { port1, port2 } = new MessageChannel();
    repo.networkSubsystem.addNetworkAdapter(
      new MessageChannelNetworkAdapter(port1)
    );
    return port2;
  }
}

window.getRepoChannel = getRepoChannel;

// Connect to SharedWorker for cross-tab sync
// Worker has its own Subduction with server connection
try {
  const sharedWorker = createSharedWorker();
  repo.networkSubsystem.addNetworkAdapter(
    new MessageChannelNetworkAdapter(sharedWorker.port)
  );
  console.log("Connected to SharedWorker (cross-tab sync)");
} catch (error) {
  console.error(error);
  console.error("SharedWorker not available — running single-tab mode");
}
window.repo = repo;
window.Automerge = Automerge;
window.AutomergeRepo = AutomergeRepo;

const handlers = {
  "automerge:": createFilesystemHandoffHandler(repo),
} as const;

setup(async (href, request) =>
  handlers[new URL(href).protocol as keyof typeof handlers]?.(href, request)
);

const accountDocHandle = await getOrCreateLayoutDocHandle(repo);

window.accountDocHandle = accountDocHandle;

registerPatchworkViewElement({ repo });
registerPatchworkToolPickerElement({ repo });

const rootElement = document.getElementById("root")!;

rootElement.setAttribute("doc-url", accountDocHandle.url);
rootElement.setAttribute("tool-id", accountDocHandle.doc().frameToolId);

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
    const docType = type || (doc as any)?.["@patchwork"]?.type;
    if (docType) {
      const registry = getRegistry<DatatypeDescription>("patchwork:datatype");
      const datatype = registry.get(docType);
      if (datatype?.importUrl) {
        const mod = await import(/* @vite-ignore */ datatype.importUrl);
        const impl = mod.default as DatatypeImplementation;
        const docTitle = impl.getTitle(doc);
        if (docTitle) {
          document.title = `${docTitle} | GAIOS`;
        }
      }
    }
  } catch (e) {
    console.error("Failed to update document title", e);
  }
});

const moduleWatcher = new ModuleWatcher(
  repo,
  [
    accountDocHandle.doc().moduleSettingsUrl,
    // default tools for gaios
    "automerge:2u4x5b6JdSMDkyyMrQRzb8dreHhL" as AutomergeRepo.AutomergeUrl,
  ],
  (name, mod, meta) => {
    if (Array.isArray(mod.plugins)) {
      if (isValidAutomergeUrl(name)) {
        const baseUrl = automergeUrlToServiceWorkerUrl(
          name as AutomergeRepo.AutomergeUrl
        );
        registerPlugins(mod.plugins, baseUrl, meta);
      }
    }
  }
);

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
