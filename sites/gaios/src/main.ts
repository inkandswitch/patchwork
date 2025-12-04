import "./global.css";

import { CONTEXT, Context } from "@patchwork/context";
import {
  registerPatchworkViewElement,
  openDocument,
} from "@patchwork/elements";
import {
  ModuleWatcher,
  createFilesystemHandoffHandler,
} from "@patchwork/filesystem";
import setup from "@patchwork/bootloader";
import {
  LoadedPlugin,
  PluginDescription,
  registerPlugins,
} from "@patchwork/plugins";
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
  type UrlHeads,
} from "@automerge/vanillajs";
import { plugins } from "./tools";
import * as Automerge from "@automerge/automerge";
import * as AutomergeRepo from "@automerge/automerge-repo";

declare global {
  interface Window {
    accountDocHandle: DocHandle<TinyPatchworkLayoutDoc>;
    CONTEXT: Context;
    Automerge: typeof import("@automerge/automerge");
    AutomergeRepo: typeof import("@automerge/automerge-repo");
    repo: Repo;
    getRepoChannel: () => MessagePort
  }
}

const repo = new Repo({storage: new IndexedDBStorageAdapter()})

function createSharedWorker() {
   return new SharedWorker(
    new URL("./automerge-worker.ts", import.meta.url),
    {
      type: "module",
      name: "automerge-repo-shared-worker",
    }
  )
}

function getRepoChannel() {
  try {
    const worker = createSharedWorker()
    return worker.port
  } catch (error) {
    console.error(error)
    console.error("Falling back to tab-only repo strategy")
    const {port1, port2} = new MessageChannel()
    repo.networkSubsystem.addNetworkAdapter(new MessageChannelNetworkAdapter(port1))
    return port2
  }
}

window.getRepoChannel = getRepoChannel

try {
  const sharedWorker = createSharedWorker()
  repo.networkSubsystem.addNetworkAdapter(new MessageChannelNetworkAdapter(sharedWorker.port))
} catch (error) {
  console.error(error)
  console.error("Falling back to tab-only repo strategy")
  repo.networkSubsystem.addNetworkAdapter(new WebSocketClientAdapter("wss://sync3.automerge.org"))
}


window.repo = repo;
window.Automerge = Automerge;
window.AutomergeRepo = AutomergeRepo;
window.CONTEXT = CONTEXT;

const handlers = {
  "automerge:": createFilesystemHandoffHandler(repo),
} as const;

setup(async (href, request) =>
  handlers[new URL(href).protocol as keyof typeof handlers]?.(href, request)
);

// TODO: delete once we have moved all of tools to their own thing
const loadedPlugins = Object.groupBy(
  await Promise.allSettled<LoadedPlugin<PluginDescription, any>>(
    plugins.map(async (plugin) => ({
      ...plugin,
      module: plugin.module || (await plugin.load()),
    }))
  ),
  (result) => result.status
);

if (loadedPlugins.fulfilled) {
  registerPlugins(
    // @ts-expect-error TODO: we are violating the registry here, but its okay til we get the tools out of here
    loadedPlugins.fulfilled
      .filter((x) => x.status == "fulfilled")
      .map((x) => x.value),
    "DEV"
  );
}

if (loadedPlugins.rejected) {
  console.warn("failed to load some plugins:", loadedPlugins.rejected);
}

const accountDocHandle = await getOrCreateLayoutDocHandle(repo);

window.accountDocHandle = accountDocHandle;

const moduleWatcher = new ModuleWatcher(
  accountDocHandle.doc().moduleSettingsUrl,
  [],
  repo,
  (name, mod) => {
    if (Array.isArray(mod.plugins)) {
      // TODO: maybe get rid of this check?
      if (isValidAutomergeUrl(name)) {
        registerPlugins(mod.plugins, name);
      }
    }
  }
);

registerPatchworkViewElement({ moduleWatcher, repo });

const rootElement = document.getElementById("root")!;

rootElement.setAttribute("doc-url", accountDocHandle.url);
rootElement.setAttribute("tool-id", accountDocHandle.doc().frameToolId);

rootElement.addEventListener("patchwork:open-document", (event) => {
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
});

const bigPatchworkHashRegex =
  /(?<title>[A-Za-z0-9-]+)--(?<docId>[1-9A-HJ-NP-Za-km-z]+)(?<type>\?=[^&?]+)?/;

const handleHashChange = async (hash: string) => {
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
  const hash = window.location.hash;
  handleHashChange(hash.slice(1));
});

if (window.location.hash) {
  const hash = window.location.hash.slice(1);
  // todo: actually wait for root to be mounted
  setTimeout(() => {
    handleHashChange(hash);
  }, 100);
}
