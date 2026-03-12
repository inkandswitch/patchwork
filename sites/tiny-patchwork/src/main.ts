import "./global.css";

import {
  registerPatchworkViewElement,
  openDocument,
} from "@inkandswitch/patchwork-elements";
import {
  ModuleWatcher,
  createFilesystemHandoffHandler,
} from "@inkandswitch/patchwork-filesystem";
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
  WebSocketClientAdapter,
  type AutomergeUrl,
  type UrlHeads,
} from "@automerge/vanillajs";
import * as Automerge from "@automerge/automerge";
import * as AutomergeRepo from "@automerge/automerge-repo";

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

const workerLogChannel = new BroadcastChannel("automerge-worker-logs");
workerLogChannel.onmessage = (event) => {
  const { level, args } = event.data;
  const method = level in console ? level : "log";
  (console as any)[method](...args);
};

const repo = new Repo({
  storage: new IndexedDBStorageAdapter(),
  async sharePolicy(peerId) {
    return peerId.includes("shared-worker");
  },
  enableRemoteHeadsGossiping: true,
});

repo.subscribeToRemotes([
  "3760df37-a4c6-4f66-9ecd-732039a9385d" as import("@automerge/automerge-repo").StorageId,
]);

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

try {
  const sharedWorker = createSharedWorker();
  repo.networkSubsystem.addNetworkAdapter(
    new MessageChannelNetworkAdapter(sharedWorker.port)
  );
} catch (error) {
  console.error(error);
  console.error("Falling back to tab-only repo strategy");
  repo.networkSubsystem.addNetworkAdapter(
    new WebSocketClientAdapter("wss://sync3.automerge.org")
  );
}

document.body.style.background = "#fffffe";

await repo.networkSubsystem.adapters[0].whenReady();
// if this helps then we are sad and confused but at least it helped
await new Promise((resolve) => setTimeout(resolve, 1000));
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
const initialParams = new URLSearchParams(location.hash.slice(1));
if (initialParams.has("frame")) {
  rootElement.setAttribute("tool-id", initialParams.get("frame")!);
  const docId = initialParams.get("doc");
  const docUrl = docId
    ? stringifyAutomergeUrl({ documentId: docId as import("@automerge/automerge-repo").DocumentId })
    : accountDocHandle.url;
  rootElement.setAttribute("doc-url", docUrl);
} else {
  rootElement.setAttribute("tool-id", accountDocHandle.doc().frameToolId);
  rootElement.setAttribute("doc-url", accountDocHandle.url);
}

const defaultToolsUrl =
  "automerge:2LZBb891v37vggWYQPJRbYdyBGGE" as AutomergeUrl;

function onModuleLoaded(name: string, mod: any) {
  if (Array.isArray(mod.plugins)) {
    registerPlugins(mod.plugins, name);
  }
}

const moduleWatcher = new ModuleWatcher(
  repo,
  [defaultToolsUrl, accountDocHandle.doc().moduleSettingsUrl],
  onModuleLoaded
);

window.patchwork = { repo, modules: moduleWatcher, plugins, accountDocHandle };

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
