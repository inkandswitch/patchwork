import "./global.css";

// Wasm is initialized by init-wasm.ts before this module loads (see index.html)

import {
  registerPatchworkViewElement,
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
  isValidDocumentId,
  MessageChannelNetworkAdapter,
  parseAutomergeUrl,
  Repo,
  stringifyAutomergeUrl,
  type AutomergeUrl,
  type UrlHeads,
} from "@automerge/vanillajs";
import * as Automerge from "@automerge/automerge";
import * as AutomergeRepo from "@automerge/automerge-repo";
import { SubductionStorageBridge } from "@automerge/automerge-repo-subduction-bridge";
import { Subduction, WebCryptoSigner } from "@automerge/automerge_subduction";

// todo maybe we should have a window.patchwork namespace for this?
declare global {
  interface Window {
    accountDocHandle: DocHandle<TinyPatchworkLayoutDoc>;
    Automerge: typeof import("@automerge/automerge");
    AutomergeRepo: typeof import("@automerge/automerge-repo");
    repo: InstanceType<typeof Repo>;
    getRepoChannel: () => MessagePort;
  }
}

const workerLogChannel = new BroadcastChannel("automerge-worker-logs");
workerLogChannel.onmessage = (event) => {
  const { level, args } = event.data;
  const method = level in console ? level : "log";
  (console as any)[method](...args);
};

// Create Subduction instance (shares IndexedDB storage with SharedWorker)
// Wasm was initialized in repo-init.ts before this module loaded
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

document.body.style.background = "#fffffe";
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

const rootElement = document.getElementById("root")!;
rootElement.style.visibility = "hidden";
document.body.style.background = "#fffefe";
const initialParams = new URLSearchParams(location.hash);
if (initialParams.has("frame")) {
  rootElement.setAttribute("tool-id", initialParams.get("frame")!);
  const docUrl = initialParams.get("doc") ?? accountDocHandle.url;
  rootElement.setAttribute("doc-url", docUrl);
} else {
  rootElement.setAttribute("doc-url", accountDocHandle.url);
  rootElement.setAttribute("tool-id", accountDocHandle.doc().frameToolId);
}

const defaultToolsUrl =
  "automerge:2AprWUew8LpPGrVTGsX29ANsXEU7" as AutomergeUrl;

function onModuleLoaded(
  name: string,
  mod: any,
  meta?: { branch: string; sourceDocUrl: AutomergeUrl; version: string }
) {
  console.log(
    "[main] onModuleLoaded:",
    name.slice(0, 30) + "...",
    "plugins?",
    Array.isArray(mod.plugins),
    meta ? `branch=${meta.branch}` : "(no meta)"
  );
  if (Array.isArray(mod.plugins)) {
    const baseUrl = automergeUrlToServiceWorkerUrl(name as AutomergeUrl);
    registerPlugins(mod.plugins, baseUrl, meta);
  }
}

const moduleWatcher = new ModuleWatcher(
  repo,
  [defaultToolsUrl, accountDocHandle.doc().moduleSettingsUrl],
  onModuleLoaded
);

rootElement.addEventListener("patchwork:no-tool", (event) => {
  moduleWatcher.loadSuggestedImportUrl(event.detail.url);
});

rootElement.addEventListener("patchwork:open-document", async (event) => {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const { url, toolId, type, title } = event.detail;
  const { documentId, heads } = parseAutomergeUrl(url);
  params.set("doc", documentId);
  if (heads) params.set("heads", heads?.join("|"));
  else params.delete("heads");
  if (toolId) params.set("tool", toolId);
  else params.delete("tool");
  if (title) params.set("title", title);
  else params.delete("title");
  if (type) params.set("type", type);
  else params.delete("type");
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
          document.title = `${docTitle} | patchwork`;
        }
      }
    }
  } catch (e) {
    console.error("Failed to update document title", e);
  }
});

let firstMount = true;
rootElement.addEventListener("patchwork:mounted", (event) => {
  handleHashChange();
  //console.info(`tool mounted`, event.detail.toolId);
  if (event.target != rootElement) return;
  console.info(`root element mounted`);
  if (firstMount) {
    firstMount = false;
    rootElement.style.visibility = "visible";
    document.body.style.background = "";
  }
  setTimeout(() => {
    handleHashChange();
  }, 1000);
});
setTimeout(() => {
  if (firstMount) {
    rootElement.style.visibility = "visible";
    document.body.style.background = "";
  }
}, 12000);

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
  const frame = params.get("frame");
  if (frame) {
    rootElement.setAttribute("tool-id", frame);
    const docUrl = initialParams.get("doc") ?? accountDocHandle.url;
    rootElement.setAttribute("doc-url", docUrl);
  }
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

async function uncache(match: string) {
  for (const name of await caches.keys()) {
    const cache = await caches.open(name);
    for (const request of await cache.keys()) {
      if (request.url.includes(match)) {
        cache.delete(request);
      }
    }
  }
}

(window as any).uncache = uncache;
