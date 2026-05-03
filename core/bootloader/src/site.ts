/**
 * High-level browser-app boot sequence for a Patchwork site.
 *
 * Layers on top of {@link setupServiceWorker} (the package default export) to
 * construct the Repo, wire up the service-worker port, load plugins via the
 * ModuleWatcher, resolve the user's account document, and hand control to the
 * configured root tool.
 *
 * This entry point pulls in DOM- and plugin-layer dependencies (patchwork
 * elements, plugins, filesystem) and is intended for use only from a browser
 * site's `main.ts`. Non-UI consumers should import the package default (which
 * only does SW registration and port handoff).
 */
import {
  type DocHandle,
  IndexedDBStorageAdapter,
  initializeWasm,
  isValidAutomergeUrl,
  isValidDocumentId,
  MessageChannelNetworkAdapter,
  parseAutomergeUrl,
  Repo,
  stringifyAutomergeUrl,
  type AutomergeUrl,
  type DocumentId,
  type StorageId,
  type UrlHeads,
} from "@automerge/vanillajs/slim";
import * as Automerge from "@automerge/automerge/slim";
import * as AutomergeRepo from "@automerge/automerge-repo/slim";
// eslint-disable-next-line
// @ts-ignore — initSync is a wasm-bindgen runtime helper not in the .d.ts
import { initSync as initSubductionSync } from "@automerge/automerge-subduction/slim";

import { ModuleWatcher } from "@inkandswitch/patchwork-filesystem";
import {
  openDocument,
  registerPatchworkViewElement,
} from "@inkandswitch/patchwork-elements";
import {
  type AccountDoc,
  type DatatypeDescription,
  type DatatypeImplementation,
  getRegistry,
  registerPlugins,
  resolveAccountHandle,
} from "@inkandswitch/patchwork-plugins";
import * as plugins from "@inkandswitch/patchwork-plugins";

import setupServiceWorker from "./setup.js";
import { SwLogReader } from "./sw-logger.js";
import debug from "debug";
const log = debug("patchwork:bootloader:site");

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
      sw: {
        printLogs: (n?: number) => Promise<void>;
        tailLogs: (n?: number) => ReturnType<typeof SwLogReader.tail>;
        exportLogs: () => Promise<string>;
        clearLogs: () => Promise<void>;
      };
    };
    uncache: (match: string) => Promise<void>;
  }
}

export interface SiteConfig {
  /**
   * Automerge URL of the site's default module-settings document — the bundle
   * of tools every user of this site gets out of the box. Must contribute at
   * least a `patchwork:datatype` registration for `"account"` (typically the
   * one supplied by `@inkandswitch/patchwork-frame`).
   *
   * Can be overridden at runtime by setting `localStorage.defaultToolsUrl` to
   * another automerge: URL — useful for local development against an
   * unpublished tool set.
   */
  defaultModulesUrl: AutomergeUrl;

  /**
   * `localStorage` key under which this site remembers which account document
   * belongs to the current user. Sites sharing an origin MUST use distinct
   * keys so they do not clobber each other's accounts.
   */
  accountStorageKey: string;

  /**
   * Brand word appended to the document title as `"<doc> | <titleSuffix>"`
   * when a document is open. The separator is provided for you.
   */
  titleSuffix: string;

  /**
   * DOM id of the `<patchwork-view>` element that will host the root tool.
   * Defaults to `"root"`.
   */
  rootElementId?: string;

  /**
   * Storage IDs to subscribe to for remote-heads gossiping. Defaults to
   * Ink & Switch's production Subduction storage.
   */
  remoteStorageIds?: StorageId[];
}

export interface BootResult {
  repo: Repo;
  moduleWatcher: ModuleWatcher;
  accountDocHandle: DocHandle<AccountDoc>;
}

const DEFAULT_REMOTE_STORAGE_ID =
  "3760df37-a4c6-4f66-9ecd-732039a9385d" as StorageId;

// Legacy big-patchwork hash shape: `slug--<documentId>[?=type]`.
const BIG_PATCHWORK_HASH_REGEX =
  /(?<title>[A-Za-z0-9-]+)--(?<docId>[1-9A-HJ-NP-Za-km-z]+)(?<type>\?=[^&?]+)?/;

const [automergeWasm, subductionWasm] = await Promise.all([
  fetch("/automerge.wasm?main").then((r) => r.bytes()),
  fetch("/subduction.wasm").then((r) => r.bytes()),
]);

/**
 * Boot a Patchwork browser site.
 *
 * Performs the full application-shell setup: service worker + port, Repo,
 * plugin/module loading, account resolution, URL-hash routing, and dev-console
 * globals (`window.repo`, `window.patchwork`, `window.uncache`). Returns the
 * constructed Repo, ModuleWatcher and account handle for sites that want to
 * do additional wiring after boot.
 */
export async function bootPatchworkSite(
  config: SiteConfig
): Promise<BootResult> {
  const defaultModulesUrl = resolveDefaultModulesUrl(config.defaultModulesUrl);
  showLoadingAnimation();
  log(`booting`, config);
  await initializeWasm(automergeWasm);
  initSubductionSync(subductionWasm);

  const repo = new Repo({
    storage: new IndexedDBStorageAdapter(),
    async sharePolicy(peerId) {
      return peerId.includes("service-worker");
    },
    enableRemoteHeadsGossiping: true,
    peerId:
      `${config.titleSuffix}-tab-${crypto.randomUUID()}` as AutomergeRepo.PeerId,
  });

  repo.subscribeToRemotes(
    config.remoteStorageIds ?? [DEFAULT_REMOTE_STORAGE_ID]
  );

  const sw = await setupServiceWorker();
  if (!sw) throw new Error("Failed to set up service worker");
  const net = new MessageChannelNetworkAdapter(sw.port);
  repo.networkSubsystem.addNetworkAdapter(net);
  await net.whenReady();

  installDevConsoleGlobals(repo);
  registerPatchworkViewElement({ repo });

  // The watcher is started with the site's default-tools bundle alone so that
  // `resolveAccountHandle` below has something to await on (the `account`
  // datatype lives in that bundle today). The user's own module-settings URL
  // is added lazily once it appears on the account doc — see below.
  const moduleWatcher = new ModuleWatcher(
    repo,
    [defaultModulesUrl],
    onModuleLoaded
  );

  const accountDocHandle = await resolveAccountHandle(repo, {
    storageKey: config.accountStorageKey,
  });

  window.accountDocHandle = accountDocHandle;

  wireModuleSettingsWhenReady(accountDocHandle, moduleWatcher);

  const rootElement = document.getElementById(config.rootElementId ?? "root");
  if (!rootElement) {
    throw new Error(
      `bootPatchworkSite: no element with id="${config.rootElementId ?? "root"}"`
    );
  }

  primeRootElement(rootElement, accountDocHandle);
  logToolRegistryWhenLoaded(moduleWatcher);

  window.patchwork = {
    repo,
    modules: moduleWatcher,
    plugins,
    accountDocHandle,
    sw: buildSwLogApi(),
  };
  window.uncache = uncache;

  installHashRouting({
    rootElement,
    repo,
    accountDocHandle,
    moduleWatcher,
    titleSuffix: config.titleSuffix,
  });

  return { repo, moduleWatcher, accountDocHandle };
}

// ─── Internals ──────────────────────────────────────────────────────────

function resolveDefaultModulesUrl(builtin: AutomergeUrl): AutomergeUrl {
  const override = globalThis.localStorage?.getItem("defaultToolsUrl");
  if (!override) return builtin;
  if (isValidAutomergeUrl(override)) {
    if (override !== builtin) {
      console.info(
        `using defaultToolsUrl override from localStorage: ${override}`
      );
    }
    return override;
  }
  console.warn(
    `ignoring invalid defaultToolsUrl in localStorage: ${override}; using built-in default`
  );
  return builtin;
}

function installDevConsoleGlobals(repo: Repo): void {
  window.repo = repo;
  window.Automerge = Automerge;
  window.AutomergeRepo = AutomergeRepo;
  window.getRepoChannel = () => {
    const { port1, port2 } = new MessageChannel();
    navigator.serviceWorker.controller!.postMessage({ type: "port" }, [port2]);
    return port1;
  };
}

function onModuleLoaded(name: string, mod: any): void {
  if (Array.isArray(mod.plugins)) {
    log(
      `registering ${mod.plugins.length} plugin(s) from ${name.slice(0, 30)}...`,
      mod.plugins.map((p: any) => `${p.type}:${p.id}`)
    );
    registerPlugins(mod.plugins, name);
  } else {
    console.warn(
      `module ${name.slice(0, 30)}... has no plugins array`,
      Object.keys(mod)
    );
  }
}

/**
 * The frame lazy-creates `moduleSettingsUrl` on first mount. Watch for it to
 * appear on the account doc and feed it into the ModuleWatcher so the user's
 * own tool bundle loads alongside the site default. Idempotent.
 */
function wireModuleSettingsWhenReady(
  accountDocHandle: DocHandle<AccountDoc>,
  moduleWatcher: ModuleWatcher
): void {
  const wire = () => {
    const url = accountDocHandle.doc()?.moduleSettingsUrl;
    if (!url) return;
    void moduleWatcher.addUrl(url);
    accountDocHandle.off("change", wire);
  };
  wire();
  if (!accountDocHandle.doc()?.moduleSettingsUrl) {
    accountDocHandle.on("change", wire);
  }
}

/**
 * Set initial `tool-id` / `doc-url` attributes on the root `<patchwork-view>`
 * based on the URL hash (if it specifies a frame override) or the account
 * doc's configured frame tool + the account doc itself.
 */
function primeRootElement(
  rootElement: HTMLElement,
  accountDocHandle: DocHandle<AccountDoc>
): void {
  rootElement.style.visibility = "hidden";

  const initialParams = new URLSearchParams(location.hash.slice(1));
  if (initialParams.has("frame")) {
    rootElement.setAttribute("tool-id", initialParams.get("frame")!);
    const docId = initialParams.get("doc");
    const docUrl = docId
      ? stringifyAutomergeUrl({ documentId: docId as DocumentId })
      : accountDocHandle.url;
    rootElement.setAttribute("doc-url", docUrl);
  } else {
    rootElement.setAttribute("tool-id", accountDocHandle.doc().frameToolId);
    rootElement.setAttribute("doc-url", accountDocHandle.url);
  }
}

function logToolRegistryWhenLoaded(moduleWatcher: ModuleWatcher): void {
  moduleWatcher.doneLoading
    .then(() => {
      const toolReg = getRegistry("patchwork:tool");
      const tools = toolReg.all();
      log(
        `doneLoading: ${tools.length} tools registered:`,
        tools.map((t: any) => t.id)
      );
    })
    .catch((err: unknown) => {
      console.error("doneLoading rejected:", err);
    });
}

function buildSwLogApi(): Window["patchwork"]["sw"] {
  return {
    printLogs: async (n = 200) => {
      const entries = await SwLogReader.tail(n);
      for (const e of entries) {
        const prefix = `[${e.ts}] [${e.level}]`;
        if (e.data !== undefined) log(prefix, e.msg, e.data);
        else log(prefix, e.msg);
      }
      log(`--- ${entries.length} entries ---`);
    },
    tailLogs: (n = 200) => SwLogReader.tail(n),
    exportLogs: () => SwLogReader.exportAll(),
    clearLogs: () => SwLogReader.clear(),
  };
}

const LOADING_STYLE_ID = "pw-bootloader-loading-styles";
const LOADING_ELEMENT_ID = "pw-bootloader-loading";

function showLoadingAnimation(): void {
  if (!document.getElementById(LOADING_STYLE_ID)) {
    const style = document.createElement("style");
    style.id = LOADING_STYLE_ID;
    style.textContent = `
      @keyframes pw-bootloader-pulse {
        0%, 100% { opacity: 0.25; }
        50% { opacity: 0.95; }
      }
      #${LOADING_ELEMENT_ID} {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-color: #fff;
        background-image:
          radial-gradient(ellipse 55% 45% at 28% 35%, #fde4ec, transparent 70%),
          radial-gradient(ellipse 50% 55% at 72% 65%, #e0f0fb, transparent 70%),
          radial-gradient(ellipse 65% 55% at 50% 50%, #f1e6f6, transparent 80%);
        animation: pw-bootloader-pulse 3.5s ease-in-out infinite;
        transition: opacity 0.6s ease-out;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      }
      @media (prefers-color-scheme: dark) {
        #${LOADING_ELEMENT_ID} {
          background-color: #000;
          background-image:
            radial-gradient(ellipse 55% 45% at 28% 35%, #2a1d33, transparent 70%),
            radial-gradient(ellipse 50% 55% at 72% 65%, #1a2738, transparent 70%),
            radial-gradient(ellipse 65% 55% at 50% 50%, #221a2e, transparent 80%);
        }
      }
      #${LOADING_ELEMENT_ID}.pw-bootloader-fading {
        opacity: 0;
        animation: none;
      }
    `;
    document.head.appendChild(style);
  }
  if (document.getElementById(LOADING_ELEMENT_ID)) return;
  const el = document.createElement("div");
  el.id = LOADING_ELEMENT_ID;
  document.body.appendChild(el);
}

function hideLoadingAnimation(): void {
  const el = document.getElementById(LOADING_ELEMENT_ID);
  if (!el) return;
  el.classList.add("pw-bootloader-fading");
  setTimeout(() => el.remove(), 700);
}

async function uncache(match: string): Promise<void> {
  for (const name of await caches.keys()) {
    const cache = await caches.open(name);
    for (const request of await cache.keys()) {
      if (request.url.includes(match)) {
        cache.delete(request);
      }
    }
  }
}

interface HashRoutingParams {
  rootElement: HTMLElement;
  repo: Repo;
  accountDocHandle: DocHandle<AccountDoc>;
  moduleWatcher: ModuleWatcher;
  titleSuffix: string;
}

function installHashRouting(params: HashRoutingParams): void {
  const { rootElement, repo, accountDocHandle, moduleWatcher, titleSuffix } =
    params;

  rootElement.addEventListener("patchwork:no-tool", (event) => {
    moduleWatcher.loadSuggestedImportUrl(event.detail.url);
  });

  rootElement.addEventListener("patchwork:open-document", async (event) => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const { url, toolId, type, title } = event.detail as {
      url: AutomergeUrl;
      toolId?: string;
      type?: string;
      title?: string;
    };
    const { documentId, heads } = parseAutomergeUrl(url);
    params.set("doc", documentId);
    if (heads) params.set("heads", heads.join("|"));
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
      if (!docType) return;
      const registry = getRegistry<DatatypeDescription>("patchwork:datatype");
      const datatype = await registry.load(docType);
      if (!datatype) return;
      const docTitle = (datatype.module as DatatypeImplementation).getTitle(
        doc
      );
      if (docTitle) {
        document.title = `${docTitle} | ${titleSuffix}`;
      }
    } catch (e) {
      console.error("Failed to update document title", e);
    }
  });

  let firstMount = true;
  const reveal = () => {
    if (!firstMount) return;
    firstMount = false;
    rootElement.style.visibility = "visible";
    hideLoadingAnimation();
  };

  rootElement.addEventListener("patchwork:mounted", (event) => {
    handleHashChange();
    if (event.target !== rootElement) return;
    console.info("root element mounted");
    reveal();
    // Re-resolve routing after a beat so deep-links from freshly-loaded tools
    // get a second chance to render.
    setTimeout(handleHashChange, 1000);
  });

  // Failsafe: if nothing ever mounts, reveal the element anyway after 12s so
  // the user sees *something* rather than a blank page.
  setTimeout(reveal, 12_000);

  const handleHashChange = async () => {
    const hash = window.location.hash.slice(1);
    const legacy = BIG_PATCHWORK_HASH_REGEX.exec(hash);

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

  window.addEventListener("hashchange", handleHashChange);
}
