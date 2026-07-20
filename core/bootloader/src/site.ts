/**
 * Browser-app boot sequence for a Patchwork site.
 *
 * Layers on top of {@link setupServiceWorker} to construct the Repo, wire up
 * the automerge-worker port, load plugins via the ModuleWatcher, resolve the
 * user's account document, and hand control to the configured root tool.
 *
 * Pulls in DOM- and plugin-layer dependencies, so it is for a browser site's
 * `main.ts` only. Non-UI consumers should import the package default, which
 * does SW registration and the automerge-worker handoff and nothing else.
 */
import {
  type DocHandle,
  initializeWasm,
  isValidAutomergeUrl,
  isValidDocumentId,
  MessageChannelNetworkAdapter,
  Repo,
  stringifyAutomergeUrl,
  type AutomergeUrl,
  type DocumentId,
} from "@automerge/vanillajs/slim";
import { IndexedDBWorkerStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb/IndexedDBWorkerStorageAdapter";
import * as Automerge from "@automerge/automerge/slim";
import * as AutomergeRepo from "@automerge/automerge-repo/slim";
import {
  initKeyhiveWasm,
  initializeAutomergeRepoKeyhiveWithRepo,
  type AutomergeRepoKeyhive,
} from "@automerge/automerge-repo-keyhive";
// eslint-disable-next-line
// @ts-ignore — initSync is a wasm-bindgen runtime helper not in the .d.ts
import { initSync as initSubductionSync } from "@automerge/automerge-subduction/slim";
import { MemorySigner } from "@automerge/automerge-subduction/slim";

import { ModuleWatcher } from "@inkandswitch/patchwork-filesystem";
import { importAutomergePackageViaWorker } from "./module-loader.js";
import {
  openDocument,
  registerPatchworkViewElement,
} from "@inkandswitch/patchwork-elements";
import { registerRepoProviderElement } from "@inkandswitch/patchwork-providers";
import {
  type AccountDoc,
  type DatatypeDescription,
  type DatatypeImplementation,
  getRegistry,
  registerPlugins,
  resolveAccountHandle,
  unregisterPlugins,
} from "@inkandswitch/patchwork-plugins";
import * as plugins from "@inkandswitch/patchwork-plugins";

import setupServiceWorker, { lifecycleLog } from "./setup.js";
import type {
  ServiceWorkerRepoChannelListener,
  SyncStateDocMessage,
} from "./types.js";
import debug from "debug";

const log = debug("patchwork:bootloader:site");

declare const __SITE_NAME__: string;
const siteName =
  typeof __SITE_NAME__ !== "undefined"
    ? __SITE_NAME__
    : "patchwork.inkandswitch.com";

// Must match the automerge-worker's selection, or the tab and the SW grant
// relay access to different servers.
declare const __KEYHIVE_SYNC_SERVER__: boolean;
const useKeyhiveSyncServer =
  typeof __KEYHIVE_SYNC_SERVER__ !== "undefined" && __KEYHIVE_SYNC_SERVER__;

type SignerIdentity = { peerId: string; verifyingKey: string };

declare global {
  interface Window {
    accountDocHandle: DocHandle<AccountDoc>;
    Automerge: typeof import("@automerge/automerge");
    AutomergeRepo: typeof import("@automerge/automerge-repo");
    repo: Repo;
    hive?: AutomergeRepoKeyhive;
    getRepoChannel: () => MessagePort;
    patchwork: {
      repo: Repo;
      packages: ModuleWatcher;
      plugins: typeof plugins;
      accountDocHandle: DocHandle<AccountDoc>;
      signer?: SignerIdentity;
      sw: {
        connectClassicSync: (server?: string) => Promise<void>;
        subscribeToRepoChannel: (
          listener: ServiceWorkerRepoChannelListener
        ) => Promise<() => void>;
        subscribeSyncState: (
          documentId: string,
          listener: (update: SyncStateDocMessage) => void
        ) => () => void;
      };
    };
    uncache: (match: string) => Promise<void>;
  }
}

export interface SiteConfig {
  /**
   * The site's default tool bundle — the tools every user of this site gets
   * out of the box. Must collectively contribute at least a
   * `patchwork:datatype` registration for `"account"` (typically the one
   * supplied by `@inkandswitch/patchwork-frame`).
   *
   * Each entry is a *module-list source* and may be either:
   *  - an Automerge module-settings doc URL (`automerge:...`), which is
   *    live-reloaded, or
   *  - an HTTP(S) URL (absolute or site-relative, e.g. `/modules.json`) to a
   *    static JSON manifest of the shape `{ modules: string[], branches? }`,
   *    fetched once at boot.
   *
   * The module URLs *inside* either kind of source may themselves be Automerge
   * folder docs or plain HTTP(S) bundles, so deployment targets can be freely
   * mixed.
   *
   * Overridable at runtime with `localStorage.systemPackageListURL`.
   */
  defaultModules?: string | string[];

  /**
   * @deprecated Use {@link SiteConfig.defaultModules}. Retained for backwards
   * compatibility with existing sites.
   */
  defaultModulesUrl?: AutomergeUrl;

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

  /** DOM id of the `<patchwork-view>` hosting the root tool. Defaults to "root". */
  rootElementId?: string;

  /**
   * Initialize keyhive for access control. The Repo then uses keyhive's network
   * adapter, peerId and idFactory instead of a sharePolicy.
   */
  keyhive?: boolean;
}

export interface BootResult {
  repo: Repo;
  moduleWatcher: ModuleWatcher;
  accountDocHandle: DocHandle<AccountDoc>;
}

// Started at module evaluation but not top-level awaited: awaiting here would
// hold up everything importing this module, so the loading animation couldn't
// appear until the biggest download of the boot had already finished.
const wasmFetches = Promise.all([
  fetch("/automerge.wasm").then((r) => r.bytes()),
  fetch("/subduction.wasm").then((r) => r.bytes()),
]);
wasmFetches.catch(() => {});

export async function bootPatchworkSite(
  config: SiteConfig
): Promise<BootResult> {
  const moduleSources = resolveDefaultModules(config);
  showLoadingAnimation();
  log("booting", config);
  installLifecycleLogging();

  const [automergeWasm, subductionWasm] = await wasmFetches;
  await initializeWasm(automergeWasm);
  initSubductionSync(subductionWasm);

  const sw = await setupServiceWorker();
  if (!sw) throw new Error("Failed to set up service worker");
  log("workers ready");

  let hive: AutomergeRepoKeyhive | undefined;
  let repo: Repo;
  let signerIdentity: SignerIdentity | undefined;
  // Called with a fresh port when the automerge worker dies and is recreated.
  // Assigned once the repo exists.
  let onWorkerPortRenewed: ((port: MessagePort) => void) | undefined;

  // An embedding context may have provided a Repo before this entry ran. Reuse
  // it and its keyhive so we share the same documents and sync context.
  if (window.repo) {
    log("using existing Repo from window");
    repo = window.repo;
    hive = window.hive;
  } else {
    const workerPort = await firstRepoPort(sw, (port) => {
      if (onWorkerPortRenewed) onWorkerPortRenewed(port);
      else {
        console.warn(
          "automerge worker port renewed before the repo existed; dropping it"
        );
      }
    });

    let workerAdapter = new MessageChannelNetworkAdapter(workerPort);
    ({ repo, hive, signerIdentity } = await createRepo(config, workerAdapter));

    // The worker was recreated with cold state: wire the repo onto the fresh
    // port and drop the adapter stranded on the dead one.
    const bootHive = hive;
    onWorkerPortRenewed = (port) => {
      const fresh = new MessageChannelNetworkAdapter(port);
      // Mirror the boot wiring: a keyhive repo talks to the worker through a
      // keyhive adapter wrapped around the message channel.
      const registered = bootHive
        ? bootHive.createKeyhiveNetworkAdapter(fresh, false, false, 2000)
        : fresh;
      repo.networkSubsystem.addNetworkAdapter(registered as any);
      removeAdapterFor(repo, workerAdapter, registered);
      workerAdapter = fresh;
      lifecycleLog("repo re-wired to the recreated automerge worker");
    };
  }

  window.repo = repo;
  window.Automerge = Automerge;
  window.AutomergeRepo = AutomergeRepo;
  window.getRepoChannel = sw.getRepoChannel;
  if (hive) window.hive = hive;

  await repo.networkSubsystem.whenReady();
  log("networkSubsystem ready");
  (hive?.networkAdapter as any)?.syncKeyhive?.();

  registerRepoProviderElement(repo as any);

  const rootElementId = config.rootElementId ?? "root";
  const rootElement = document.getElementById(rootElementId);
  if (!rootElement) {
    throw new Error(`bootPatchworkSite: no element with id="${rootElementId}"`);
  }

  // `<repo-provider>` sits above the root and answers `repo:handle-descriptor`
  // for any view outside a remapper, resolving to the requested url unchanged.
  const repoProvider = document.createElement("repo-provider");
  rootElement.parentElement!.insertBefore(repoProvider, rootElement);
  repoProvider.appendChild(rootElement);

  registerPatchworkViewElement({ hive, repo });

  // Started with the site bundle alone so resolveAccountHandle has something to
  // await on — the `account` datatype lives there. The user's own
  // module-settings URL is added lazily once it appears on the account doc.
  const moduleWatcher = new ModuleWatcher(
    repo,
    nameSources(moduleSources),
    onModuleLoaded,
    unregisterPlugins,
    // Discover an Automerge package's plugin descriptors off the main thread;
    // each plugin's load() re-imports the package (at heads) on this thread.
    importAutomergePackageViaWorker
  );

  const accountDocHandle = (await resolveAccountHandle(repo, {
    storageKey: config.accountStorageKey,
    hive,
  })) as DocHandle<AccountDoc>;

  window.accountDocHandle = accountDocHandle;
  window.uncache = uncache;
  window.patchwork = {
    repo,
    packages: moduleWatcher,
    plugins,
    accountDocHandle,
    ...(signerIdentity ? { signer: signerIdentity } : {}),
    sw: {
      connectClassicSync: sw.connectClassicSync,
      subscribeToRepoChannel: sw.subscribeToRepoChannel,
      subscribeSyncState: sw.subscribeSyncState,
    },
  };

  wireModuleSettings(accountDocHandle, moduleWatcher);
  primeRootElement(rootElement, accountDocHandle);

  moduleWatcher.doneLoading.then(
    () =>
      log(
        "doneLoading, tools registered:",
        getRegistry("patchwork:tool")
          .all()
          .map((t: any) => t.id)
      ),
    (err: unknown) => console.error("doneLoading rejected:", err)
  );

  installHashRouting({
    rootElement,
    repo,
    accountDocHandle,
    titleSuffix: config.titleSuffix,
  });

  return { repo, moduleWatcher, accountDocHandle };
}

/**
 * Resolve with the first repo port the worker delivers, calling `onRenewed` for
 * every later one.
 *
 * subscribeToRepoChannel is deliberately not awaited: it resolves only after
 * the boot channel's port-ready handshake, which can take its full 30s timeout
 * against a stranded worker connection. Boot blocks on the first *delivered*
 * port instead — if the boot channel stalls, worker recovery hands the listener
 * a good port long before that timeout.
 */
function firstRepoPort(
  sw: Awaited<ReturnType<typeof setupServiceWorker>>,
  onRenewed: (port: MessagePort) => void
): Promise<MessagePort> {
  return new Promise<MessagePort>((resolve) => {
    let seen = false;
    void sw.subscribeToRepoChannel((port) => {
      if (seen) return onRenewed(port);
      seen = true;
      resolve(port);
    });
  });
}

async function createRepo(
  config: SiteConfig,
  workerAdapter: MessageChannelNetworkAdapter
): Promise<{
  repo: Repo;
  hive?: AutomergeRepoKeyhive;
  signerIdentity?: SignerIdentity;
}> {
  if (config.keyhive) {
    log("setting up keyhive");
    initKeyhiveWasm();
    const { hive, repo } = await initializeAutomergeRepoKeyhiveWithRepo({
      createRepo: (repoConfig) => new Repo(repoConfig),
      storage: new IndexedDBWorkerStorageAdapter(`${siteName}-keyhive`),
      peerIdSuffix: siteName + Math.random().toString(36).slice(2),
      networkAdapter: workerAdapter,
      automaticArchiveIngestion: true,
      cachingMode: "periodic",
      onlyShareWithHardcodedServerPeerId: false,
      // ARK selects the relay via `syncServer`, defaulting to "subduction".
      ...(useKeyhiveSyncServer ? { syncServer: "keyhive" as const } : {}),
      repo: {
        storage: new IndexedDBWorkerStorageAdapter(),
        enableRemoteHeadsGossiping: true,
      },
    });
    log("keyhive setup complete");
    return { repo, hive };
  }

  // An explicit signer, rather than the Repo's internal default, so the tab's
  // identity can be exposed on window.patchwork. The tab never connects via
  // Subduction, so this id never goes on the wire.
  const signer = new MemorySigner();
  const repo = new Repo({
    network: [workerAdapter],
    storage: new IndexedDBWorkerStorageAdapter(),
    signer,
    async sharePolicy(peerId) {
      return peerId.includes("automerge-worker");
    },
    enableRemoteHeadsGossiping: true,
    peerId:
      `${config.titleSuffix}-tab-${crypto.randomUUID()}` as AutomergeRepo.PeerId,
  });
  const signerIdentity = {
    peerId: signer.peerId().toString(),
    verifyingKey: (
      signer.verifyingKey() as Uint8Array<ArrayBufferLike> & {
        toHex(): string;
      }
    ).toHex(),
  };
  log("repo created, tab subduction identity:", signerIdentity);
  return { repo, signerIdentity };
}

/** Drop the adapter sitting on the dead worker port, leaving `keep` in place. */
function removeAdapterFor(
  repo: Repo,
  stale: MessageChannelNetworkAdapter,
  keep: unknown
): void {
  for (const adapter of [...repo.networkSubsystem.adapters]) {
    if (adapter === keep) continue;
    // The keyhive wrapper keeps the wrapped adapter on `.networkAdapter`.
    const base = (adapter as any).networkAdapter ?? adapter;
    if (base !== stale) continue;
    try {
      repo.networkSubsystem.removeNetworkAdapter(adapter as any);
    } catch (err) {
      console.error("failed to remove stale worker network adapter", err);
    }
  }
}

function isValidModuleSource(source: string): boolean {
  return isValidAutomergeUrl(source) || /^(https?:\/\/|\.?\/)/.test(source);
}

/**
 * The site's default module-list sources, honouring the
 * `localStorage.systemPackageListURL` dev override, which replaces the entire
 * built-in bundle. `defaultToolsUrl` is the pre-rename key.
 */
function resolveDefaultModules(config: SiteConfig): string[] {
  const configured = config.defaultModules ?? config.defaultModulesUrl ?? [];
  const builtin = (
    Array.isArray(configured) ? configured : [configured]
  ).filter(Boolean);

  const storage = globalThis.localStorage;
  const override =
    storage?.getItem("systemPackageListURL") ??
    storage?.getItem("defaultToolsUrl");

  if (override && isValidModuleSource(override)) {
    console.info(`using systemPackageListURL from localStorage: ${override}`);
    return [override];
  }
  if (override) {
    console.warn(
      `ignoring invalid systemPackageListURL in localStorage: ${override}`
    );
  }

  if (builtin.length === 0) {
    throw new Error(
      "bootPatchworkSite: no default module sources configured (set `defaultModules`)"
    );
  }
  return builtin;
}

/**
 * Name the sources for the ModuleWatcher. The first keeps the canonical
 * `system` name; the rest get suffixed. None may be `user`, which is reserved
 * for the per-account settings doc and has branch-override precedence.
 */
function nameSources(sources: string[]): Record<string, string> {
  return Object.fromEntries(
    sources.map((source, i) => [i === 0 ? "system" : `system-${i}`, source])
  );
}

/** Page Lifecycle and connectivity transitions, to line up against the
 * SharedWorker's sync-socket reaps. */
function installLifecycleLogging(): void {
  if (typeof document === "undefined") return;
  const opts = { capture: true } as const;
  const persisted = (e: Event) => (e as PageTransitionEvent).persisted;

  document.addEventListener(
    "visibilitychange",
    () => lifecycleLog("visibilitychange → %s", document.visibilityState),
    opts
  );
  document.addEventListener(
    "freeze",
    () => lifecycleLog("freeze (tab suspended)"),
    opts
  );
  document.addEventListener(
    "resume",
    () => lifecycleLog("resume (tab unsuspended)"),
    opts
  );
  window.addEventListener(
    "pageshow",
    (e) => lifecycleLog("pageshow persisted=%s", persisted(e)),
    opts
  );
  window.addEventListener(
    "pagehide",
    (e) => lifecycleLog("pagehide persisted=%s", persisted(e)),
    opts
  );
  window.addEventListener("online", () => lifecycleLog("online"), opts);
  window.addEventListener("offline", () => lifecycleLog("offline"), opts);

  lifecycleLog(
    "logging installed (visibilityState=%s, hasFocus=%s)",
    document.visibilityState,
    document.hasFocus()
  );
}

function onModuleLoaded(name: string, mod: any): void {
  if (!Array.isArray(mod.plugins)) {
    console.warn(`module ${name} has no plugins array`, Object.keys(mod));
    return;
  }
  log(
    `registering ${mod.plugins.length} plugin(s) from ${name}`,
    mod.plugins.map((p: any) => `${p.type}:${p.id}`)
  );
  registerPlugins(mod.plugins, name);
}

/**
 * The frame lazy-creates `moduleSettingsUrl` on first mount, so watch for it to
 * appear and feed it to the ModuleWatcher.
 */
function wireModuleSettings(
  accountDocHandle: DocHandle<AccountDoc>,
  moduleWatcher: ModuleWatcher
): void {
  const wire = () => {
    const url = accountDocHandle.doc()?.moduleSettingsUrl;
    if (!url) return;
    void moduleWatcher.addUrl("user", url);
    accountDocHandle.off("change", wire);
  };
  wire();
  if (!accountDocHandle.doc()?.moduleSettingsUrl) {
    accountDocHandle.on("change", wire);
  }
}

function primeRootElement(
  rootElement: HTMLElement,
  accountDocHandle: DocHandle<AccountDoc>
): void {
  rootElement.style.visibility = "hidden";
  const params = new URLSearchParams(location.hash.slice(1));
  const frame = params.get("frame");
  rootElement.setAttribute(
    "tool-id",
    frame ?? accountDocHandle.doc().frameToolId
  );
  rootElement.setAttribute(
    "doc-url",
    (frame && docParamToUrl(params.get("doc"))) || accountDocHandle.url
  );
}

// ── Loading animation ───────────────────────────────────────────────────

const LOADING_STYLE_ID = "pw-bootloader-loading-styles";
const LOADING_ELEMENT_ID = "pw-bootloader-loading";

const LOADING_CSS = `
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

function showLoadingAnimation(): void {
  if (!document.getElementById(LOADING_STYLE_ID)) {
    const style = document.createElement("style");
    style.id = LOADING_STYLE_ID;
    style.textContent = LOADING_CSS;
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
      if (request.url.includes(match)) cache.delete(request);
    }
  }
}

// ── Hash routing ────────────────────────────────────────────────────────

// Legacy big-patchwork hash shape: `<slug>--<documentId>[?…]`. The slug can
// contain characters we don't otherwise permit (e.g. `drawing-(branch-1)`), so
// anchor on the `--` before the base58 document id rather than a strict slug
// charset.
const BIG_PATCHWORK_HASH_REGEX =
  /^(?<title>[^=&?/#]*)--(?<docId>[1-9A-HJ-NP-Za-km-z]+)/;

// The `doc=` value is an automerge URL, kept literal rather than
// percent-encoded so links stay readable.
const RAW_HASH_KEYS = new Set(["doc"]);
// A stable order means re-serializing the same logical params is
// byte-identical, avoiding spurious `hashchange` round-trips.
const HASH_KEY_ORDER = ["doc", "tool", "type", "title", "frame"];

function serializeHashParams(params: URLSearchParams): string {
  const keys = [...HASH_KEY_ORDER, ...params.keys()];
  const parts: string[] = [];
  const emitted = new Set<string>();
  for (const key of keys) {
    if (emitted.has(key)) continue;
    const value = params.get(key);
    if (!value) continue;
    emitted.add(key);
    parts.push(
      `${key}=${RAW_HASH_KEYS.has(key) ? value : encodeURIComponent(value)}`
    );
  }
  return parts.join("&");
}

/**
 * Coerce a `doc=` hash param to a full automerge URL. Accepts a full URL
 * (`automerge:<id>[#heads]`) or a bare document id, for older links.
 */
function docParamToUrl(docParam: string | null): AutomergeUrl | undefined {
  if (!docParam) return undefined;
  if (isValidAutomergeUrl(docParam as AutomergeUrl)) {
    return docParam as AutomergeUrl;
  }
  const documentId = docParam.replace(/^automerge:/, "");
  if (!isValidDocumentId(documentId)) return undefined;
  return stringifyAutomergeUrl({ documentId: documentId as DocumentId });
}

interface HashRoutingParams {
  rootElement: HTMLElement;
  repo: Repo;
  accountDocHandle: DocHandle<AccountDoc>;
  titleSuffix: string;
}

function installHashRouting({
  rootElement,
  repo,
  accountDocHandle,
  titleSuffix,
}: HashRoutingParams): void {
  const handleHashChange = async () => {
    const hash = window.location.hash.slice(1);

    // Legacy big-patchwork link: normalize to `#doc=automerge:<docId>` and let
    // routing re-run on the resulting hashchange.
    const legacyDocId = BIG_PATCHWORK_HASH_REGEX.exec(hash)?.groups?.docId;
    if (legacyDocId && isValidDocumentId(legacyDocId)) {
      window.location.hash = serializeHashParams(
        new URLSearchParams({
          doc: stringifyAutomergeUrl({ documentId: legacyDocId as DocumentId }),
        })
      );
      return;
    }

    // Bare automerge URL: /#automerge:<documentId>
    if (isValidAutomergeUrl(hash as AutomergeUrl)) {
      window.location.hash = "";
      openDocument(rootElement, hash as AutomergeUrl);
      return;
    }

    const params = new URLSearchParams(hash);
    const docUrl = docParamToUrl(params.get("doc"));
    const frame = params.get("frame");

    if (frame) {
      const frameDocUrl = docUrl ?? accountDocHandle.url;
      if (
        rootElement.getAttribute("tool-id") !== frame ||
        rootElement.getAttribute("doc-url") !== frameDocUrl
      ) {
        rootElement.setAttribute("tool-id", frame);
        rootElement.setAttribute("doc-url", frameDocUrl);
      }
    }

    if (docUrl) {
      rootElement.dispatchEvent(
        new CustomEvent("patchwork:open-document", {
          detail: {
            url: docUrl,
            toolId: params.get("tool"),
            title: params.get("title"),
            type: params.get("type"),
          },
        })
      );
    }
  };

  rootElement.addEventListener("patchwork:open-document", async (event) => {
    const { url, toolId, type, title } = event.detail as {
      url: AutomergeUrl;
      toolId?: string;
      type?: string;
      title?: string;
    };

    const params = new URLSearchParams(window.location.hash.slice(1));
    // `doc` is the full automerge URL, so heads live inside it and the separate
    // `heads=` param is gone.
    params.delete("heads");
    params.set("doc", url);
    for (const [key, value] of [
      ["tool", toolId],
      ["title", title],
      ["type", type],
    ] as const) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    window.location.hash = serializeHashParams(params);

    try {
      const docHandle = await repo.find<{ "@patchwork"?: { type?: string } }>(
        url
      );
      const doc = docHandle.doc();
      const docType = type || doc?.["@patchwork"]?.type;
      if (!docType) return;
      const datatype =
        await getRegistry<DatatypeDescription>("patchwork:datatype").load(
          docType
        );
      if (!datatype) return;
      const docTitle = (datatype.module as DatatypeImplementation).getTitle(
        doc
      );
      if (docTitle) document.title = `${docTitle} | ${titleSuffix}`;
    } catch (e) {
      console.error("Failed to update document title", e);
    }
  });

  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    rootElement.style.visibility = "visible";
    hideLoadingAnimation();
  };

  rootElement.addEventListener("patchwork:mounted", (event) => {
    if (event.target !== rootElement) return;
    log("root element mounted");
    void handleHashChange();
    reveal();
    // Deep-links from freshly-loaded tools get a second chance to render.
    setTimeout(handleHashChange, 1000);
  });

  // If nothing ever mounts, reveal anyway so the user sees something rather
  // than a blank page.
  setTimeout(reveal, 12_000);

  window.addEventListener("hashchange", handleHashChange);
}
