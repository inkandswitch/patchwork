import "./global.css";

import {
  registerPatchworkViewElement,
  openDocument,
} from "@inkandswitch/patchwork-elements";
import { ModuleWatcher } from "@inkandswitch/patchwork-filesystem";
import setup from "@inkandswitch/patchwork-bootloader";
import { SwLogReader } from "@inkandswitch/patchwork-bootloader/sw-logger";
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
  type AutomergeUrl,
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

// Published tools are registered in this module settings doc by publish-all-tools.
// Can be overridden for development or forked tool sets by setting
// `localStorage.defaultToolsUrl` to an automerge: URL.
const DEFAULT_TOOLS_URL =
  "automerge:415R9K4Jde4ByU94X8fUDUxy2tFW" as AutomergeUrl;
const override = localStorage.getItem("defaultToolsUrl");
const defaultToolsUrl =
  override && isValidAutomergeUrl(override) ? override : DEFAULT_TOOLS_URL;
if (override && defaultToolsUrl !== DEFAULT_TOOLS_URL) {
  console.info(`using defaultToolsUrl override from localStorage: ${override}`);
} else if (override) {
  console.warn(
    `ignoring invalid defaultToolsUrl in localStorage: ${override}; using built-in default`
  );
}

const result = await setup({
  moduleSettingsUrls: [defaultToolsUrl],
});
if (!result) {
  throw new Error("Failed to set up service worker");
}

repo.networkSubsystem.addNetworkAdapter(
  new MessageChannelNetworkAdapter(result.port)
);
await repo.networkSubsystem.whenReady();

window.getRepoChannel = () => {
  const { port1, port2 } = new MessageChannel();
  navigator.serviceWorker.controller!.postMessage({ type: "port" }, [port2]);
  return port1;
};

document.body.style.background = "#fffffe";

window.repo = repo;
window.Automerge = Automerge;
window.AutomergeRepo = AutomergeRepo;

registerPatchworkViewElement({ repo });

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

// Kick off default-tools loading first; this is what registers the `account`
// datatype that resolveAccountHandle waits on, plus the frame tool itself.
const moduleWatcher = new ModuleWatcher(
  repo,
  [defaultToolsUrl],
  onModuleLoaded
);

const accountDocHandle = await resolveAccountHandle(repo, {
  storageKey: "tinyPatchworkAccountUrl",
});
await repo.flush();

window.accountDocHandle = accountDocHandle;

// The frame lazy-creates moduleSettingsUrl on first mount. Wire it into the
// watcher as soon as it appears.
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
  rootElement.setAttribute("tool-id", accountDocHandle.doc().frameToolId);
  rootElement.setAttribute("doc-url", accountDocHandle.url);
}

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

// ── SW log access (mirrors the SW inspector console API) ────────────────
(window.patchwork as any).sw = {
  printLogs: async (n = 200) => {
    const entries = await SwLogReader.tail(n);
    for (const e of entries) {
      const prefix = `[${e.ts}] [${e.level}]`;
      if (e.data !== undefined) console.log(prefix, e.msg, e.data);
      else console.log(prefix, e.msg);
    }
    console.log(`--- ${entries.length} entries ---`);
  },
  tailLogs: (n = 200) => SwLogReader.tail(n),
  exportLogs: () => SwLogReader.exportAll(),
  clearLogs: () => SwLogReader.clear(),
};

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
    const docUrl = params.get("doc") ?? accountDocHandle.url;
    if (
      rootElement.getAttribute("tool-id") !== frame ||
      rootElement.getAttribute("doc-url") !== docUrl
    ) {
      rootElement.setAttribute("tool-id", frame);
      rootElement.setAttribute("doc-url", docUrl);
    }
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
