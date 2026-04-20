import "./global.css";

import {
  registerPatchworkViewElement,
  openDocument,
} from "@inkandswitch/patchwork-elements";
import { ModuleWatcher } from "@inkandswitch/patchwork-filesystem";
import setup from "@inkandswitch/patchwork-bootloader";
import {
  registerPlugins,
  resolveAccountHandle,
  DatatypeDescription,
  DatatypeImplementation,
  getRegistry,
  type AccountDoc,
} from "@inkandswitch/patchwork-plugins";
import * as plugins from "@inkandswitch/patchwork-plugins";
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

declare global {
  interface Window {
    accountDocHandle: DocHandle<AccountDoc>;
    Automerge: typeof import("@automerge/automerge");
    AutomergeRepo: typeof import("@automerge/automerge-repo");
    repo: Repo;
    getRepoChannel: () => MessagePort;
    patchwork: {
      repo: Repo;
      modules: ModuleWatcher;
      plugins: typeof plugins;
      accountDocHandle: DocHandle<AccountDoc>;
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

const result = await setup();
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

registerPatchworkViewElement({ repo });

// Default tools bundle. Can be overridden for development or forked tool sets
// by setting `localStorage.defaultToolsUrl` to an automerge: URL.
const DEFAULT_TOOLS_URL =
  "automerge:3XRXFS96oVXe5D4joMyQWAfNeFNN" as AutomergeRepo.AutomergeUrl;
const defaultToolsOverride = localStorage.getItem("defaultToolsUrl");
const defaultToolsUrl =
  defaultToolsOverride && isValidAutomergeUrl(defaultToolsOverride)
    ? defaultToolsOverride
    : DEFAULT_TOOLS_URL;
if (defaultToolsOverride && defaultToolsUrl !== DEFAULT_TOOLS_URL) {
  console.info(
    `using defaultToolsUrl override from localStorage: ${defaultToolsOverride}`
  );
} else if (defaultToolsOverride) {
  console.warn(
    `ignoring invalid defaultToolsUrl in localStorage: ${defaultToolsOverride}; using built-in default`
  );
}

const moduleWatcher = new ModuleWatcher(
  repo,
  [defaultToolsUrl],
  (name, mod) => {
    if (Array.isArray(mod.plugins)) {
      // TODO: maybe get rid of this check?
      if (isValidAutomergeUrl(name)) {
        registerPlugins(mod.plugins, name);
      }
    }
  }
);

const accountDocHandle = await resolveAccountHandle(repo, {
  storageKey: "gaiosAccountUrl",
});
await repo.flush();

window.accountDocHandle = accountDocHandle;

const wireModuleSettings = () => {
  const url = accountDocHandle.doc()?.moduleSettingsUrl;
  if (!url) return;
  void moduleWatcher.addUrl(url);
  accountDocHandle.off("change", wireModuleSettings);
};
wireModuleSettings();
if (!accountDocHandle.doc()?.moduleSettingsUrl) {
  accountDocHandle.on("change", wireModuleSettings);
}

const rootElement = document.getElementById("root")!;

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
    const docHandle = await repo.find<{ "@patchwork"?: { type?: string } }>(
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

window.addEventListener("hashchange", () => {
  handleHashChange();
});
