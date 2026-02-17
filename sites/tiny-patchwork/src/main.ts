import "./global.css";

import {
  registerPatchworkViewElement,
  openDocument,
} from "@inkandswitch/patchwork-elements";
import {
  ModuleSettingsDoc,
  ModuleWatcher,
  automergeUrlToServiceWorkerUrl,
  createFilesystemHandoffHandler,
  importModuleFromFolderDocUrl,
} from "@inkandswitch/patchwork-filesystem";
import setup from "@inkandswitch/patchwork-bootloader";
import { registerPlugins } from "@inkandswitch/patchwork-plugins";
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
  WebSocketClientAdapter,
  type AutomergeUrl,
  type UrlHeads,
} from "@automerge/vanillajs";
import * as Automerge from "@automerge/automerge";
import * as AutomergeRepo from "@automerge/automerge-repo";

// todo maybe we should have a window.patchwork namespace for this?
declare global {
  interface Window {
    accountDocHandle: DocHandle<TinyPatchworkLayoutDoc>;
    Automerge: typeof import("@automerge/automerge");
    AutomergeRepo: typeof import("@automerge/automerge-repo");
    repo: Repo;
    getRepoChannel: () => MessagePort;
  }
}

const repo = new Repo({ storage: new IndexedDBStorageAdapter() });

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
  "automerge:2LZBb891v37vggWYQPJRbYdyBGGE" as AutomergeUrl;

const account = accountDocHandle.doc();
const defaultPackagesHandle =
  await repo.find<ModuleSettingsDoc>(defaultToolsUrl);
const defaultPackages = defaultPackagesHandle.doc().modules;
const importantTools = [
  account.frameToolId,
  ...account.documentToolbarToolIds,
  account.contextSidebarToolId,
  ...account.contextToolIds,
  account.accountSidebarToolId,
];
for (const url of defaultPackages) {
  const pkg = await importModuleFromFolderDocUrl(url);

  for (const plugin of pkg.plugins) {
    if (importantTools.includes(plugin.id)) {
      registerPlugins(pkg, url);
      continue;
    }
  }
}

const moduleWatcher = new ModuleWatcher(
  repo,
  [
    defaultToolsUrl,
    accountDocHandle.doc().moduleSettingsUrl,
    // tiny patchwork default tools
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

rootElement.addEventListener("patchwork:no-tool", (event) => {
  moduleWatcher.loadSuggestedImportUrl(event.detail.url);
});

// todo the stuff below this can be wrapped up in a library
// and used by any frame tool if they !element.closest("patchwork-view")
// could also, perhaps insanely, be added directly to patchwork-view?

rootElement.addEventListener("patchwork:open-document", (event) => {
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
});

let firstMount = true;
rootElement.addEventListener("patchwork:mounted", () => {
  if (firstMount) {
    firstMount = false;
    rootElement.style.visibility = "visible";
    document.body.style.background = "";
    return;
  }
  handleHashChange();
});
setTimeout(() => {
  if (firstMount) {
    rootElement.style.visibility = "visible";
    document.body.style.background = "";
  }
}, 5000);

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

window.addEventListener("error", (event) => {
  console.info(event);
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
