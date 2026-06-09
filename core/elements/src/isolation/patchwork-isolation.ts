/**
 * `<patchwork-isolation>` custom element — renders a patchwork tool inside
 * a sandboxed iframe with data access mediated by an intermediary repo and
 * allowlist.
 *
 * Usage:
 *   <patchwork-isolation doc-url="automerge:..." tool-id="my-tool" />
 *
 * The element:
 *  1. Obtains the host repo from the nearest `<repo-provider>` ancestor
 *  2. Creates an intermediary repo with allowlist seeded from `doc-url`
 *  3. Creates a sandboxed iframe (`sandbox="allow-scripts"`)
 *  4. Sends es-module-shims source + resolved import map to the iframe
 *  5. Sets up RPC channel for module loading via es-module-shims source hook
 *  6. Sets up provider and navigation bridges
 *  7. Inside the iframe, a normal `<patchwork-view>` renders in legacy mode
 *
 * Register at boot time via `registerPatchworkIsolationElement()`.
 */

import {
  type AutomergeUrl,
  type Repo,
  isValidAutomergeUrl,
} from "@automerge/automerge-repo";
import { getRegistry, getAllRegistries } from "@inkandswitch/patchwork-plugins";
import {
  getImportableUrlFromAutomergeUrl,
  resolvePackageExport,
  type FolderDoc,
  type BranchesDoc,
  type HasPatchworkMetadata,
  type ModuleSettingsDoc,
} from "@inkandswitch/patchwork-filesystem";
import type { RepoProviderElement } from "@inkandswitch/patchwork-providers";
import { createIntermediaryRepo, collectAutomergeUrls, SyncDenylist, type IntermediaryRepo } from "./intermediary-repo.js";
import { startModuleRpc } from "./module-rpc.js";
import { PackageUrlMapper } from "./package-url-mapper.js";
import { startHostProviderBridge } from "./provider-bridge.js";
import { startHostNavigationBridge } from "./navigation-bridge.js";
import { generateIframeSrcdoc, type RegistryEntry } from "./iframe-bootstrap.js";
import debug from "debug";

const log = debug("patchwork:elements:isolation");

// ---------------------------------------------------------------------------
// Denylist population — blocks sensitive documents from syncing to iframe
// ---------------------------------------------------------------------------

/** Denylist a FolderDoc and all its child documents. */
async function denylistFolderDoc(
  repo: Repo,
  folderUrl: AutomergeUrl,
  denylist: SyncDenylist
): Promise<void> {
  denylist.add(folderUrl);
  try {
    const handle = await repo.find<FolderDoc>(folderUrl);
    await handle.whenReady();
    const doc = handle.doc();
    for (const docLink of doc?.docs ?? []) {
      denylist.add(docLink.url);
    }
  } catch (err) {
    log(`denylistFolderDoc: failed to read folder ${folderUrl}`, err);
  }
}

/**
 * Denylist a module entry (either a BranchesDoc or a direct FolderDoc)
 * and all its transitive children.
 */
async function denylistModuleEntry(
  repo: Repo,
  moduleUrl: AutomergeUrl,
  denylist: SyncDenylist
): Promise<void> {
  denylist.add(moduleUrl);
  try {
    const handle = await repo.find<HasPatchworkMetadata>(moduleUrl);
    await handle.whenReady();
    const doc = handle.doc();
    const type = doc?.["@patchwork"]?.type;

    if (type === "branches") {
      const branchesDoc = doc as unknown as BranchesDoc;
      for (const branchUrl of Object.values(branchesDoc.branches ?? {})) {
        await denylistFolderDoc(repo, branchUrl, denylist);
      }
    } else {
      await denylistFolderDoc(repo, moduleUrl, denylist);
    }
  } catch (err) {
    log(`denylistModuleEntry: failed to read module ${moduleUrl}`, err);
  }
}

/**
 * Populate the denylist with all sensitive documents: account doc,
 * module settings docs, and all tool/package source code documents.
 */
async function populateDenylist(
  repo: Repo,
  denylist: SyncDenylist
): Promise<void> {
  // 1. Account document
  const accountHandle = (window as any).accountDocHandle;
  if (accountHandle?.url) {
    denylist.add(accountHandle.url);
  }

  // 2. Module settings documents (from ModuleWatcher)
  const moduleWatcher = (window as any).patchwork?.packages;
  const moduleSettingsUrls: AutomergeUrl[] = [];
  if (moduleWatcher?.urls) {
    for (const url of Object.values(moduleWatcher.urls) as AutomergeUrl[]) {
      if (isValidAutomergeUrl(url)) {
        denylist.add(url);
        moduleSettingsUrls.push(url);
      }
    }
  }

  // 3. Walk module settings → module entries → folder docs → children
  for (const settingsUrl of moduleSettingsUrls) {
    try {
      const handle = await repo.find<ModuleSettingsDoc>(settingsUrl);
      await handle.whenReady();
      const doc = handle.doc();
      for (const moduleUrl of doc?.modules ?? []) {
        await denylistModuleEntry(repo, moduleUrl, denylist);
      }
    } catch (err) {
      log(`populateDenylist: failed to read module settings ${settingsUrl}`, err);
    }
  }

  // 4. Denylist all plugin importUrls from the registry as a catch-all
  for (const [, registry] of getAllRegistries()) {
    for (const plugin of registry.all()) {
      const importUrl = (plugin as any).importUrl as string | undefined;
      if (importUrl && isValidAutomergeUrl(importUrl)) {
        await denylistModuleEntry(repo, importUrl as AutomergeUrl, denylist);
      }
    }
  }

  log(`denylist populated with ${denylist.size} documents`);
}

/**
 * Check if a document is a sensitive type (branches doc, module settings, etc.)
 * and dynamically add it to the denylist if so. Called when URLs are about to
 * be added to the allowlist to prevent sensitive documents from leaking through
 * document content.
 *
 * Returns true if the document was denylisted (caller should skip allowlisting).
 */
async function checkAndDenylistIfSensitive(
  repo: Repo,
  url: AutomergeUrl,
  denylist: SyncDenylist
): Promise<boolean> {
  if (denylist.hasUrl(url)) return true;

  try {
    const handle = await repo.find<HasPatchworkMetadata>(url);
    await handle.whenReady();
    const doc = handle.doc();
    const type = doc?.["@patchwork"]?.type;

    if (type === "branches") {
      log(`dynamically denylisting branches doc: ${url}`);
      const branchesDoc = doc as unknown as BranchesDoc;
      denylist.add(url);
      for (const branchUrl of Object.values(branchesDoc.branches ?? {})) {
        await denylistFolderDoc(repo, branchUrl, denylist);
      }
      return true;
    }

    if (type === "patchwork:module-settings") {
      log(`dynamically denylisting module settings doc: ${url}`);
      denylist.add(url);
      const settingsDoc = doc as unknown as ModuleSettingsDoc;
      for (const moduleUrl of settingsDoc.modules ?? []) {
        await denylistModuleEntry(repo, moduleUrl, denylist);
      }
      return true;
    }
  } catch (err) {
    log(`checkAndDenylistIfSensitive: failed to read ${url}`, err);
  }

  return false;
}

declare global {
  interface HTMLElementTagNameMap {
    "patchwork-isolation": PatchworkIsolationElement;
  }
}

export interface PatchworkIsolationElement extends HTMLElement {
  docUrl: AutomergeUrl | null;
  toolId: string | null;
}

/**
 * Collect registry entries from all plugin registries for pre-populating
 * the iframe's registries.
 */
/**
 * Resolve a plugin's automerge importUrl to its package entry point URL
 * and package name from package.json.
 */
async function resolvePluginEntryUrl(
  importUrl: string
): Promise<{ entryUrl: string; packageName?: string } | undefined> {
  const folderPath = getImportableUrlFromAutomergeUrl(importUrl as AutomergeUrl);
  const base = new URL(folderPath, window.location.origin);
  const packageJsonUrl = new URL("package.json", base).href;

  const response = await fetch(packageJsonUrl);
  if (!response.ok) return undefined;

  const pkgJson = await response.json();
  const entryPoint = resolvePackageExport(pkgJson);
  if (!entryPoint) return undefined;

  return {
    entryUrl: new URL(entryPoint, base).href,
    packageName: pkgJson.name,
  };
}

/**
 * Collect registry entries, converting automerge importUrls to pkg: URLs
 * via the mapper so that automerge document IDs don't leak to the iframe.
 */
async function collectRegistryEntries(
  mapper: PackageUrlMapper
): Promise<RegistryEntry[]> {
  const entries: RegistryEntry[] = [];

  for (const [, registry] of getAllRegistries()) {
    for (const plugin of registry.all()) {
      let importUrl = (plugin as any).importUrl as string | undefined;

      if (importUrl) {
        const resolved = await resolvePluginEntryUrl(importUrl);
        if (resolved) {
          importUrl = mapper.toPackageUrl(
            resolved.entryUrl,
            resolved.packageName
          );
        } else {
          importUrl = undefined;
        }
      }

      // Strip non-cloneable properties (functions, loaded implementations)
      // and deep-copy everything else so it can be sent via postMessage.
      const { load, module, ...rest } = plugin as any;
      let entry: RegistryEntry;
      try {
        entry = structuredClone(rest);
      } catch (err) {
        log(`skipping non-cloneable plugin: ${rest.id}`, err);
        continue;
      }
      entry.importUrl = importUrl;
      entries.push(entry);
    }
  }

  return entries;
}

interface ImportMap {
  imports?: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

/**
 * Read the host page's import map and resolve all URLs to absolute.
 */
function getResolvedImportMap(): ImportMap {
  const script = document.querySelector('script[type="importmap"]');
  if (!script?.textContent) return {};
  try {
    const raw: ImportMap = JSON.parse(script.textContent);
    const baseURI = document.baseURI;
    const resolved: ImportMap = {};

    if (raw.imports) {
      resolved.imports = {};
      for (const [key, value] of Object.entries(raw.imports)) {
        try {
          resolved.imports[key] = new URL(value, baseURI).href;
        } catch {
          resolved.imports[key] = value;
        }
      }
    }

    if (raw.scopes) {
      resolved.scopes = {};
      for (const [scopeKey, scopeMap] of Object.entries(raw.scopes)) {
        let resolvedKey: string;
        try {
          resolvedKey = new URL(scopeKey, baseURI).href;
        } catch {
          resolvedKey = scopeKey;
        }
        resolved.scopes[resolvedKey] = {};
        for (const [k, v] of Object.entries(scopeMap)) {
          try {
            resolved.scopes[resolvedKey][k] = new URL(v, baseURI).href;
          } catch {
            resolved.scopes[resolvedKey][k] = v;
          }
        }
      }
    }

    return resolved;
  } catch {
    return {};
  }
}

/**
 * Collect all host page stylesheets (Tailwind, DaisyUI, etc.) as a single
 * CSS string. Tools inside the iframe need these to render correctly.
 */
async function collectHostStyles(): Promise<string> {
  const sheets = await Promise.all(
    Array.from(document.styleSheets).map(async (sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((r) => r.cssText)
          .join("\n");
      } catch {
        if (sheet.href) {
          try {
            return await fetch(sheet.href).then((r) => r.text());
          } catch {
            return "";
          }
        }
        return "";
      }
    })
  );
  return sheets.filter(Boolean).join("\n");
}

// Cache boot assets so we only fetch them once across all instances.
interface BootAssets {
  esmsSource: string;
  automergeWasm: ArrayBuffer;
  subductionWasm: ArrayBuffer;
  hostStyles: string;
}

let bootAssetsPromise: Promise<BootAssets> | null = null;

function fetchBootAssets(): Promise<BootAssets> {
  if (!bootAssetsPromise) {
    bootAssetsPromise = Promise.all([
      fetch("/es-module-shims.js").then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch es-module-shims: ${r.status}`);
        return r.text();
      }),
      fetch("/automerge.wasm?main").then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch automerge.wasm: ${r.status}`);
        return r.arrayBuffer();
      }),
      fetch("/subduction.wasm").then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch subduction.wasm: ${r.status}`);
        return r.arrayBuffer();
      }),
      collectHostStyles(),
    ]).then(([esmsSource, automergeWasm, subductionWasm, hostStyles]) => ({
      esmsSource,
      automergeWasm,
      subductionWasm,
      hostStyles,
    }));
  }
  return bootAssetsPromise;
}

const ATTRS = {
  docUrl: "doc-url",
  toolId: "tool-id",
} as const;

/**
 * Defines the `<patchwork-isolation>` custom element.
 *
 * Call once at boot time. The element obtains the host repo from the
 * nearest `<repo-provider>` ancestor in the DOM.
 */
export function registerPatchworkIsolationElement(
  name = "patchwork-isolation"
): void {
  if (customElements.get(name)) return;

  customElements.define(
    name,
    class extends HTMLElement implements PatchworkIsolationElement {
      #intermediary: IntermediaryRepo | null = null;
      #iframe: HTMLIFrameElement | null = null;
      #hostRpcPort: MessagePort | null = null;
      #cleanups: Array<() => void> = [];
      #booted = false;
      #initEpoch = 0;

      static get observedAttributes() {
        return [ATTRS.docUrl, ATTRS.toolId];
      }

      get docUrl(): AutomergeUrl | null {
        return this.getAttribute(ATTRS.docUrl) as AutomergeUrl | null;
      }

      set docUrl(url: AutomergeUrl | null) {
        if (url) this.setAttribute(ATTRS.docUrl, url);
        else this.removeAttribute(ATTRS.docUrl);
      }

      get toolId(): string | null {
        return this.getAttribute(ATTRS.toolId);
      }

      set toolId(id: string | null) {
        if (id) this.setAttribute(ATTRS.toolId, id);
        else this.removeAttribute(ATTRS.toolId);
      }

      connectedCallback() {
        this.#init();
      }

      disconnectedCallback() {
        this.#teardown();
      }

      attributeChangedCallback(
        _name: string,
        old: string | null,
        val: string | null
      ) {
        if (old === val) return;
        if (this.#booted) {
          this.#teardown();
          this.#init();
        }
      }

      async #init() {
        const epoch = ++this.#initEpoch;
        const docUrl = this.docUrl;
        const toolId = this.toolId;

        log(`init ${docUrl} tool=${toolId}`);

        if (!docUrl) {
          log("no doc-url attribute");
          return;
        }

        const repoProvider = this.closest<RepoProviderElement>("repo-provider");
        const repo = repoProvider?.repo;
        if (!repo) {
          log("no <repo-provider> ancestor found");
          return;
        }

        // ── Fetch boot assets (cached) ─────────────────────────
        let assets: BootAssets;
        try {
          assets = await fetchBootAssets();
        } catch (err) {
          console.error("[patchwork-isolation] failed to load boot assets:", err);
          return;
        }

        // Abort if a newer init was started or we were torn down
        if (epoch !== this.#initEpoch) return;

        // ── Resolve import map ───────────────────────────────────
        const importMap = getResolvedImportMap();

        // ── Package URL mapper ────────────────────────────────────
        const mapper = new PackageUrlMapper();

        // ── Denylist — block sensitive documents ──────────────────
        const denylist = new SyncDenylist();
        // Fire-and-forget: populates denylist asynchronously.
        populateDenylist(repo, denylist);

        // ── Intermediary repo with allowlist + denylist ───────────
        this.#intermediary = createIntermediaryRepo({
          rootDocUrl: docUrl,
          hostRepo: repo,
          denylist,
        });

        // ── Transitive allowlist (if enabled) ────────────────────
        if (
          localStorage.getItem("patchwork:transitive-allowlist") === "true"
        ) {
          this.#setupTransitiveAllowlist(repo, docUrl, epoch, denylist);
        }

        log("intermediary repo and allowlist ready");

        // ── RPC channel ──────────────────────────────────────────
        const rpcChannel = new MessageChannel();
        this.#hostRpcPort = rpcChannel.port1;

        // ── Start host-side handlers ─────────────────────────────
        this.#cleanups.push(
          startModuleRpc({ port: this.#hostRpcPort, mapper }),
          startHostProviderBridge(this.#hostRpcPort, this),
          startHostNavigationBridge(
            this.#hostRpcPort,
            this,
            (url) => this.#intermediary?.isAllowed(url) ?? false
          )
        );

        // ── Create sandboxed iframe ──────────────────────────────
        const iframe = document.createElement("iframe");
        iframe.sandbox.add("allow-scripts");
        iframe.style.cssText =
          "border: none; width: 100%; height: 100%; display: block;";
        iframe.srcdoc = generateIframeSrcdoc();
        this.#iframe = iframe;

        const intermediaryPort = this.#intermediary.iframePort;
        const rpcPort2 = rpcChannel.port2;

        iframe.addEventListener("load", async () => {
          if (!this.#booted || epoch !== this.#initEpoch) return;
          if (!iframe.contentWindow) return;
          log("iframe ready");

          const registryEntries = await collectRegistryEntries(mapper);
          if (!this.#booted || epoch !== this.#initEpoch) return;

          // Clone WASM buffers so they can be transferred
          const automergeWasm = assets.automergeWasm.slice(0);
          const subductionWasm = assets.subductionWasm.slice(0);

          log(`sending boot message with ${registryEntries.length} registry entries`);
          iframe.contentWindow.postMessage(
            {
              type: "boot",
              docUrl,
              toolId,
              registryEntries,
              esmsSource: assets.esmsSource,
              hostStyles: assets.hostStyles,
              importMap,
              automergeWasm,
              subductionWasm,
            },
            "*",
            [rpcPort2, intermediaryPort, automergeWasm, subductionWasm]
          );
        });

        // Listen for boot errors
        const onBootMessage = (event: MessageEvent) => {
          if (event.data?.type === "boot-error") {
            console.error(
              "[patchwork-isolation] iframe boot failed:",
              event.data.error
            );
          }
        };
        this.#hostRpcPort.addEventListener("message", onBootMessage);
        this.#cleanups.push(() =>
          this.#hostRpcPort?.removeEventListener("message", onBootMessage)
        );

        this.appendChild(iframe);
        this.#booted = true;
      }

      /**
       * Scan a document for automerge URLs and add them to the allowlist.
       * Also watches for changes to dynamically expand the allowlist.
       * Each URL is checked against the denylist before allowlisting.
       */
      async #setupTransitiveAllowlist(
        repo: Repo,
        docUrl: AutomergeUrl,
        epoch: number,
        denylist?: SyncDenylist
      ) {
        const intermediary = this.#intermediary;
        if (!intermediary) return;

        const allowUrlsFromDoc = async (doc: unknown) => {
          const urls = new Set<AutomergeUrl>();
          collectAutomergeUrls(doc, urls);
          for (const url of urls) {
            if (intermediary.isAllowed(url)) continue;
            if (denylist) {
              const sensitive = await checkAndDenylistIfSensitive(repo, url, denylist);
              if (sensitive) continue;
            }
            intermediary.allow(url);
          }
        };

        try {
          const handle = await repo.find(docUrl);
          if (epoch !== this.#initEpoch) return;

          await handle.whenReady();
          if (epoch !== this.#initEpoch) return;

          const doc = handle.doc();
          if (doc) await allowUrlsFromDoc(doc);
          log("allowlisted URLs from root document");

          const onChange = ({ doc }: { doc: unknown }) => {
            void allowUrlsFromDoc(doc);
          };
          handle.on("change", onChange);
          this.#cleanups.push(() => handle.off("change", onChange));
        } catch (err) {
          log("transitive allowlist scan failed:", err);
        }
      }

      #teardown() {
        log("teardown");
        this.#initEpoch++;
        if (!this.#booted) return;
        this.#booted = false;

        for (const fn of this.#cleanups) fn();
        this.#cleanups = [];

        this.#hostRpcPort?.close();
        this.#hostRpcPort = null;

        this.#intermediary?.shutdown();
        this.#intermediary = null;

        this.#iframe?.remove();
        this.#iframe = null;
      }
    }
  );
}
