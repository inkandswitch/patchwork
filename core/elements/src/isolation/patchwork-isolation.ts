/**
 * `<patchwork-isolation>` — renders a patchwork tool inside a sandboxed
 * iframe with data access mediated by an intermediary repo and allowlist.
 *
 * Usage:
 *   <patchwork-isolation doc-url="automerge:..." tool-id="my-tool" />
 *
 * Lifecycle:
 *  1. Fetch boot assets (es-module-shims, WASM, host styles) — cached
 *  2. Create allowlist (seeded with doc-url) and denylist
 *  3. Create intermediary repo gated by allowlist + denylist
 *  4. Create sandboxed iframe and send boot message with registry entries
 *  5. Start host-side RPC for plugin loading and navigation
 *
 * Register at boot time via `registerPatchworkIsolationElement()`.
 */

import type { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import type { RepoProviderElement } from "@inkandswitch/patchwork-providers";
import {
  createIntermediaryRepo,
  SyncAllowlist,
  SyncDenylist,
  type IntermediaryRepo,
} from "./repo-bridge.js";
import {
  PluginsUrlMapper,
  getRegistries,
  startPluginsRpc,
} from "./plugins-bridge.js";
import { populateAllowlist, populateDenylist } from "./access-control.js";
import { startHostNavigationBridge } from "./navigation-bridge.js";
import { generateIframeSrcdoc } from "./iframe-bootstrap.js";
import debug from "debug";

const log = debug("patchwork:elements:isolation");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

declare global {
  interface HTMLElementTagNameMap {
    "patchwork-isolation": PatchworkIsolationElement;
  }
}

export interface PatchworkIsolationElement extends HTMLElement {
  docUrl: AutomergeUrl | null;
  toolId: string | null;
}

// ---------------------------------------------------------------------------
// Boot assets — fetched once and shared across all isolation instances
// ---------------------------------------------------------------------------

interface BootAssets {
  esmsSource: string;
  automergeWasm: ArrayBuffer;
  subductionWasm: ArrayBuffer;
  hostStyles: string;
}

let bootAssetsPromise: Promise<BootAssets> | null = null;

function fetchBootAssets(): Promise<BootAssets> {
  if (bootAssetsPromise) return bootAssetsPromise;

  bootAssetsPromise = Promise.all([
    fetch("/es-module-shims.js").then((r) => {
      if (!r.ok)
        throw new Error(`Failed to fetch es-module-shims: ${r.status}`);
      return r.text();
    }),
    fetch("/automerge.wasm?main").then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch automerge.wasm: ${r.status}`);
      return r.arrayBuffer();
    }),
    fetch("/subduction.wasm").then((r) => {
      if (!r.ok)
        throw new Error(`Failed to fetch subduction.wasm: ${r.status}`);
      return r.arrayBuffer();
    }),
    collectHostStyles(),
  ]).then(([esmsSource, automergeWasm, subductionWasm, hostStyles]) => ({
    esmsSource,
    automergeWasm,
    subductionWasm,
    hostStyles,
  }));

  return bootAssetsPromise;
}

/** Collect all host page stylesheets as a single CSS string. */
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

// ---------------------------------------------------------------------------
// Host import map resolution
// ---------------------------------------------------------------------------

interface ImportMap {
  imports?: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

/** Read the host page's import map and resolve all URLs to absolute. */
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

// ---------------------------------------------------------------------------
// Custom element
// ---------------------------------------------------------------------------

const ATTRS = {
  docUrl: "doc-url",
  toolId: "tool-id",
} as const;

/**
 * Defines the `<patchwork-isolation>` custom element.
 * Call once at boot time.
 */
export function registerPatchworkIsolationElement(
  name = "patchwork-isolation"
): void {
  if (customElements.get(name)) return;

  customElements.define(
    name,
    class extends HTMLElement implements PatchworkIsolationElement {
      #allowlist: SyncAllowlist | null = null;
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

      // ── Init ────────────────────────────────────────────────────

      async #init() {
        const epoch = ++this.#initEpoch;
        const docUrl = this.docUrl;
        const toolId = this.toolId;
        log(`init ${docUrl} tool=${toolId}`);

        if (!docUrl) {
          log("no doc-url attribute");
          return;
        }

        const repo = this.#getRepo();
        if (!repo) return;

        const assets = await this.#loadAssets(epoch);
        if (!assets) return;

        const importMap = getResolvedImportMap();
        const mapper = new PluginsUrlMapper();

        // ── Access control ──────────────────────────────────────
        const denylist = new SyncDenylist();
        populateDenylist(repo, denylist);

        const allowlist = new SyncAllowlist();
        this.#allowlist = allowlist;

        allowlist.add(docUrl);
        log(`allowlisted ${docUrl}`);
        populateAllowlist(
          repo,
          docUrl,
          allowlist,
          denylist,
          () => epoch !== this.#initEpoch
        ).then((cleanup) => {
          if (cleanup) this.#cleanups.push(cleanup);
        });

        this.#intermediary = createIntermediaryRepo({
          allowlist,
          hostRepo: repo,
          denylist,
        });

        log("intermediary repo and allowlist ready");

        // ── Host-side RPC ───────────────────────────────────────
        const rpcChannel = new MessageChannel();
        this.#hostRpcPort = rpcChannel.port1;

        this.#cleanups.push(
          startPluginsRpc({ port: this.#hostRpcPort, mapper }),
          startHostNavigationBridge(
            this.#hostRpcPort,
            this,
            (url) => this.#allowlist?.hasUrl(url) ?? false
          )
        );

        // ── Iframe ──────────────────────────────────────────────
        this.#createIframe(
          epoch,
          rpcChannel.port2,
          this.#intermediary.iframePort,
          mapper,
          assets,
          { docUrl, toolId, importMap }
        );

        this.#booted = true;
      }

      // ── Helpers ─────────────────────────────────────────────────

      #getRepo(): Repo | undefined {
        const repoProvider = this.closest<RepoProviderElement>("repo-provider");
        const repo = repoProvider?.repo;
        if (!repo) log("no <repo-provider> ancestor found");
        return repo;
      }

      async #loadAssets(epoch: number): Promise<BootAssets | undefined> {
        try {
          const assets = await fetchBootAssets();
          if (epoch !== this.#initEpoch) return undefined;
          return assets;
        } catch (err) {
          console.error(
            "[patchwork-isolation] failed to load boot assets:",
            err
          );
          return undefined;
        }
      }

      #createIframe(
        epoch: number,
        rpcPort: MessagePort,
        syncPort: MessagePort,
        mapper: PluginsUrlMapper,
        assets: BootAssets,
        config: {
          docUrl: AutomergeUrl;
          toolId: string | null;
          importMap: ImportMap;
        }
      ) {
        const iframe = document.createElement("iframe");
        iframe.sandbox.add("allow-scripts");
        iframe.style.cssText =
          "border: none; width: 100%; height: 100%; display: block;";
        iframe.srcdoc = generateIframeSrcdoc();
        this.#iframe = iframe;

        iframe.addEventListener("load", async () => {
          if (!this.#booted || epoch !== this.#initEpoch) return;
          if (!iframe.contentWindow) return;
          log("iframe ready");

          const registryEntries = await getRegistries(mapper);
          if (!this.#booted || epoch !== this.#initEpoch) return;

          const automergeWasm = assets.automergeWasm.slice(0);
          const subductionWasm = assets.subductionWasm.slice(0);

          log(
            `sending boot message with ${registryEntries.length} registry entries`
          );
          iframe.contentWindow.postMessage(
            {
              type: "boot",
              docUrl: config.docUrl,
              toolId: config.toolId,
              registryEntries,
              esmsSource: assets.esmsSource,
              hostStyles: assets.hostStyles,
              importMap: config.importMap,
              automergeWasm,
              subductionWasm,
            },
            "*",
            [rpcPort, syncPort, automergeWasm, subductionWasm]
          );
        });

        const onBootMessage = (event: MessageEvent) => {
          if (event.data?.type === "boot-error") {
            console.error(
              "[patchwork-isolation] iframe boot failed:",
              event.data.error
            );
          }
        };
        this.#hostRpcPort!.addEventListener("message", onBootMessage);
        this.#cleanups.push(() =>
          this.#hostRpcPort?.removeEventListener("message", onBootMessage)
        );

        this.appendChild(iframe);
      }

      // ── Teardown ────────────────────────────────────────────────

      #teardown() {
        log("teardown");
        this.#initEpoch++;
        if (!this.#booted) return;
        this.#booted = false;

        for (const fn of this.#cleanups) fn();
        this.#cleanups = [];

        this.#hostRpcPort?.close();
        this.#hostRpcPort = null;

        this.#allowlist = null;
        this.#intermediary?.shutdown();
        this.#intermediary = null;

        this.#iframe?.remove();
        this.#iframe = null;
      }
    }
  );
}
