import "./global.css";

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
  isValidDocumentId,
  MessageChannelNetworkAdapter,
  parseAutomergeUrl,
  Repo,
  stringifyAutomergeUrl,
  type UrlHeads,
} from "@automerge/vanillajs";
import * as Automerge from "@automerge/automerge";
import * as AutomergeRepo from "@automerge/automerge-repo";

// Side-effect import: initializes the Subduction Wasm module (via initSync)
// before the Repo constructor accesses it. The Vite alias ensures this resolves
// to the same underlying module as @automerge/automerge-subduction/slim.
import "@automerge/automerge-subduction";

declare global {
  interface Window {
    accountDocHandle: DocHandle<TinyPatchworkLayoutDoc>;
    Automerge: typeof import("@automerge/automerge");
    AutomergeRepo: typeof import("@automerge/automerge-repo");
    repo: Repo;
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
  async sharePolicy(peerId) {
    return peerId.includes("service-worker");
  },
  enableRemoteHeadsGossiping: true,
});

repo.subscribeToRemotes([
  "3760df37-a4c6-4f66-9ecd-732039a9385d" as import("@automerge/automerge-repo").StorageId,
]);

const defaultToolsUrl =
  "automerge:3XRXFS96oVXe5D4joMyQWAfNeFNN" as AutomergeRepo.AutomergeUrl;

const result = await setup({
  moduleSettingsUrls: [defaultToolsUrl],
});
if (!result) {
  throw new Error("Failed to set up service worker");
}

if (result.port) {
  repo.networkSubsystem.addNetworkAdapter(
    new MessageChannelNetworkAdapter(result.port)
  );
  await repo.networkSubsystem.whenReady();
}

window.getRepoChannel = () => {
  const { port1, port2 } = new MessageChannel();
  navigator.serviceWorker.controller!.postMessage({ type: "port" }, [port2]);
  return port1;
};

window.repo = repo;
window.Automerge = Automerge;
window.AutomergeRepo = AutomergeRepo;

const accountDocHandle = await getOrCreateLayoutDocHandle(repo);
await repo.flush();

window.accountDocHandle = accountDocHandle;

registerPatchworkViewElement({ repo });

const rootElement = document.getElementById("root")!;
rootElement.style.visibility = "hidden";
document.body.style.background = "#fffefe";

const initialParams = new URLSearchParams(location.hash.slice(1));
if (initialParams.has("frame")) {
  rootElement.setAttribute("tool-id", initialParams.get("frame")!);
  const docId = initialParams.get("doc");
  const docUrl = docId
    ? stringifyAutomergeUrl({
        documentId: docId as import("@automerge/automerge-repo").DocumentId,
      })
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

let firstMount = true;
rootElement.addEventListener("patchwork:mounted", (event) => {
  handleHashChange();
  if (event.target != rootElement) return;
  console.info(`root element mounted`);
  if (firstMount) {
    firstMount = false;
    rootElement.style.visibility = "visible";
    document.body.style.background = "";
  }
});
setTimeout(() => {
  if (firstMount) {
    rootElement.style.visibility = "visible";
    document.body.style.background = "";
  }
}, 12000);

function onModuleLoaded(name: string, mod: any) {
  if (Array.isArray(mod.plugins)) {
    console.log(
      `[main] registering ${mod.plugins.length} plugin(s) from ${name.slice(0, 30)}...`,
      mod.plugins.map((p: any) => `${p.type}:${p.id}`)
    );
    registerPlugins(mod.plugins, name);
  } else {
    console.warn(
      `[main] module ${name.slice(0, 30)}... has no plugins array`,
      Object.keys(mod)
    );
  }
}

const moduleWatcher = new ModuleWatcher(
  repo,
  [defaultToolsUrl, accountDocHandle.doc().moduleSettingsUrl],
  onModuleLoaded
);

// Log tool registry state after initial load completes
moduleWatcher.doneLoading
  .then(() => {
    const toolReg = getRegistry("patchwork:tool");
    const tools = toolReg.all();
    console.log(
      `[main] doneLoading: ${tools.length} tools registered:`,
      tools.map((t: any) => t.id)
    );
    if (!tools.find((t: any) => t.id === "patchwork-frame")) {
      console.error("[main] patchwork-frame NOT found in registry!");
    }
  })
  .catch((err: any) => {
    console.error("[main] doneLoading rejected:", err);
  });

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
