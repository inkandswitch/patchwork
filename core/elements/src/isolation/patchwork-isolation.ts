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

import type { AutomergeUrl } from "@automerge/automerge-repo";
import { getRegistry } from "@inkandswitch/patchwork-plugins";
import {
  getImportableUrlFromAutomergeUrl,
  resolvePackageExport,
} from "@inkandswitch/patchwork-filesystem";
import type { RepoProviderElement } from "@inkandswitch/patchwork-providers";
import { createIntermediaryRepo, type IntermediaryRepo } from "./intermediary-repo.js";
import { startModuleRpc } from "./module-rpc.js";
import { PackageUrlMapper } from "./package-url-mapper.js";
import { startHostProviderBridge } from "./provider-bridge.js";
import { startHostNavigationBridge } from "./navigation-bridge.js";
import { generateIframeSrcdoc, type RegistryEntry } from "./iframe-bootstrap.js";

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

  for (const type of [
    "patchwork:tool",
    "patchwork:component",
    "patchwork:datatype",
  ]) {
    const registry = getRegistry(type);
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

      const entry: RegistryEntry = {
        type: (plugin as any).type,
        id: (plugin as any).id,
        name: (plugin as any).name,
        importUrl,
      };
      if ("icon" in plugin) entry.icon = (plugin as any).icon;
      if ("supportedDatatypes" in plugin)
        entry.supportedDatatypes = (plugin as any).supportedDatatypes;
      if ("tags" in plugin) entry.tags = (plugin as any).tags;
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

// Cache boot assets so we only fetch them once across all instances.
interface BootAssets {
  esmsSource: string;
  automergeWasm: ArrayBuffer;
  subductionWasm: ArrayBuffer;
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
    ]).then(([esmsSource, automergeWasm, subductionWasm]) => ({
      esmsSource,
      automergeWasm,
      subductionWasm,
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

        if (!docUrl) {
          console.warn("[patchwork-isolation] no doc-url attribute");
          return;
        }

        const repoProvider = this.closest<RepoProviderElement>("repo-provider");
        const repo = repoProvider?.repo;
        if (!repo) {
          console.warn(
            "[patchwork-isolation] no <repo-provider> ancestor found"
          );
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

        // ── Intermediary repo with allowlist ──────────────────────
        this.#intermediary = createIntermediaryRepo({
          rootDocUrl: docUrl,
          hostRepo: repo,
        });

        // ── RPC channel ──────────────────────────────────────────
        const rpcChannel = new MessageChannel();
        this.#hostRpcPort = rpcChannel.port1;

        // ── Start host-side handlers ─────────────────────────────
        this.#cleanups.push(
          startModuleRpc({ port: this.#hostRpcPort, mapper }),
          startHostProviderBridge(this.#hostRpcPort, this),
          startHostNavigationBridge(this.#hostRpcPort, this)
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

          const registryEntries = await collectRegistryEntries(mapper);
          if (!this.#booted || epoch !== this.#initEpoch) return;

          // Clone WASM buffers so they can be transferred
          const automergeWasm = assets.automergeWasm.slice(0);
          const subductionWasm = assets.subductionWasm.slice(0);

          iframe.contentWindow.postMessage(
            {
              type: "boot",
              docUrl,
              toolId,
              registryEntries,
              esmsSource: assets.esmsSource,
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

      #teardown() {
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
