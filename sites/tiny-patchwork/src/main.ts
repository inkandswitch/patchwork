import "./global.css";

import {
  registerPatchworkViewElement,
  openDocument,
} from "@inkandswitch/patchwork-elements";
import {
  ModuleWatcher,
  findHandleInFolderHandle,
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
    __TAURI__: {
      event: {
        listen: (event: string, handler: (event: any) => void) => Promise<() => void>;
      };
      core: {
        invoke: (cmd: string, args?: Record<string, unknown>) => Promise<any>;
      };
    };
  }
}

const workerLogChannel = new BroadcastChannel("automerge-worker-logs");
workerLogChannel.onmessage = (event) => {
  const { level, args } = event.data;
  const method = level in console ? level : "log";
  (console as any)[method](...args);
};

const isTauri = "__TAURI__" in window;

const repo = new Repo({
  storage: new IndexedDBStorageAdapter(),
  async sharePolicy(peerId) {
    if (isTauri) {
      return peerId.startsWith("storage-server-");
    }
    return peerId.includes("service-worker");
  },
  enableRemoteHeadsGossiping: true,
});

repo.subscribeToRemotes([
  "3760df37-a4c6-4f66-9ecd-732039a9385d" as import("@automerge/automerge-repo").StorageId,
]);

if (isTauri) {
  // In Tauri, connect to a local sync server that stores the repo
  // in ~/.cache/automerge. No SharedWorker needed — the sync server
  // handles persistence and cross-window sync.
  repo.networkSubsystem.addNetworkAdapter(
    new WebSocketClientAdapter("ws://localhost:3030")
  );

  // Handle patchwork:// protocol requests from the Rust side.
  // This replaces the service worker for resolving automerge documents —
  // critical on iOS where WKWebView doesn't support service workers.
  const { listen } = window.__TAURI__.event;
  const { invoke } = window.__TAURI__.core;

  interface FolderDoc {
    title: string;
    docs: Array<{ name: string; url: string }>;
  }
  interface FileDoc {
    content: string | Uint8Array;
    mimeType?: string;
  }

  listen("patchwork-protocol-request", async (event: any) => {
    const { id, url } = event.payload as { id: number; url: string };
    try {
      // URL looks like http://localhost:3030/automerge%3Adocid%23heads/path/to/file
      const parsed = new URL(url);
      const rawPath = parsed.pathname.slice(1); // strip leading /
      const segments = rawPath.split("/").filter(Boolean);
      const maybeAutomergeUrl = decodeURIComponent(segments[0]);
      const path = segments.slice(1).map(decodeURIComponent);

      if (!isValidAutomergeUrl(maybeAutomergeUrl)) {
        await invoke("resolve_protocol_request", {
          id,
          body: Array.from(new TextEncoder().encode("invalid automerge url")),
          mimeType: "text/plain",
          status: 400,
          headers: {},
        });
        return;
      }

      const { heads, documentId } = parseAutomergeUrl(
        maybeAutomergeUrl as AutomergeUrl
      );

      // If no heads pinned, redirect to a versioned URL so that import()
      // caches each version under a unique URL (same as the service worker).
      if (!heads) {
        const folder = await repo.find(maybeAutomergeUrl as AutomergeUrl);
        const latestHeads = folder.heads();
        const pinnedUrl = stringifyAutomergeUrl({
          documentId,
          heads: latestHeads,
        });
        let location = `/${encodeURIComponent(pinnedUrl)}`;
        if (path.length) location += `/${path.join("/")}`;
        await invoke("resolve_protocol_request", {
          id,
          body: [],
          mimeType: "text/plain",
          status: 307,
          headers: { location },
        });
        return;
      }

      // Navigate folder structure to find the file
      const folderHandle = await repo.find<FolderDoc>(
        maybeAutomergeUrl as AutomergeUrl
      );
      const fileHandle = path.length
        ? await findHandleInFolderHandle<FileDoc>(repo, folderHandle, path)
        : folderHandle;

      const fileDoc = fileHandle?.doc() as FileDoc | undefined;
      const content = fileDoc?.content;

      if (!content) {
        await invoke("resolve_protocol_request", {
          id,
          body: Array.from(
            new TextEncoder().encode(`no content at ${url}`)
          ),
          mimeType: "text/plain",
          status: 404,
          headers: {},
        });
        return;
      }

      const body =
        content instanceof Uint8Array
          ? Array.from(content)
          : Array.from(new TextEncoder().encode(String(content)));

      await invoke("resolve_protocol_request", {
        id,
        body,
        mimeType: fileDoc?.mimeType ?? "text/plain",
        status: 200,
        headers: {},
      });
    } catch (error) {
      console.error("[patchwork protocol]", error);
      await invoke("resolve_protocol_request", {
        id,
        body: Array.from(new TextEncoder().encode(String(error))),
        mimeType: "text/plain",
        status: 500,
        headers: {},
      });
    }
  });
} else {
  const result = await setup();
  if (!result) {
    throw new Error("Failed to set up service worker");
  }

  repo.networkSubsystem.addNetworkAdapter(
    new MessageChannelNetworkAdapter(result.port)
  );
  await repo.networkSubsystem.whenReady();
}

if (!isTauri) {
  window.getRepoChannel = () => {
    const { port1, port2 } = new MessageChannel();
    navigator.serviceWorker.controller!.postMessage({ type: "port" }, [port2]);
    return port1;
  };
}

document.body.style.background = "#fffffe";

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
