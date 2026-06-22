/**
 * `<patchwork-isolation>` — renders patchwork components inside a sandboxed
 * iframe with data access mediated by an intermediary repo and allowlist.
 *
 * Usage:
 *   <patchwork-isolation>
 *     <patchwork-view doc-url="automerge:..." tool-id="my-tool" />
 *     <patchwork-view doc-url="automerge:..." tool-id="sidebar" />
 *   </patchwork-isolation>
 *
 * Child elements are serialized (tag name + attributes) and reconstructed
 * inside the iframe. All `doc-url` attributes found on children are used
 * as root URLs for the document allowlist.
 *
 * Lifecycle:
 *  1. Fetch boot assets (es-module-shims, WASM, host styles) — cached
 *  2. Serialize children and collect doc-url roots
 *  3. Create allowlist (seeded with all root URLs, populated from doc content)
 *  4. Get shared denylist (singleton, populated once from sensitive docs)
 *  5. Create intermediary repo gated by allowlist + denylist
 *  6. Start host-side RPC for plugin loading and navigation
 *  7. Create sandboxed iframe and send boot message with registry entries
 *
 * Register at boot time via `registerPatchworkIsolationElement()`.
 */

import type { AutomergeUrl, DocumentId, Repo } from "@automerge/automerge-repo";
import { isValidAutomergeUrl } from "@automerge/automerge-repo";
import type { RepoProviderElement } from "@inkandswitch/patchwork-providers";
import {
  createIntermediaryRepo,
  SyncAllowlist,
  type IntermediaryRepo,
} from "./repo-bridge.js";
import {
  PluginsUrlMapper,
  getRegistries,
  startPluginsRpc,
  watchRegistries,
} from "./plugins-bridge.js";
import { populateAllowlistFromRoots, refreshAllowlistFromRoots, getDenylist } from "./access-control.js";
import { startHostNavigationBridge } from "./navigation-bridge.js";
import { startHostProvidersBridge, ALLOWED_PROVIDERS } from "./providers-bridge.js";
import { generateIframeSrcdoc } from "./iframe-bootstrap.js";
import debug from "debug";

export const log = debug("patchwork:elements:isolation");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

declare global {
  interface HTMLElementTagNameMap {
    "patchwork-isolation": PatchworkIsolationElement;
  }
}

export interface PatchworkIsolationElement extends HTMLElement {}

/**
 * A serialized element: tag name, attributes, and children.
 * Reconstructed inside the iframe to build the isolated view tree.
 */
export interface SerializedView {
  tagName: string;
  attributes: Record<string, string>;
  children: SerializedView[];
}

/**
 * Recursively serialize an element and its descendants into a
 * transferable descriptor.
 */
function serializeElement(el: Element): SerializedView {
  const attrs: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    attrs[attr.name] = attr.value;
  }
  const children: SerializedView[] = [];
  for (const child of Array.from(el.children)) {
    children.push(serializeElement(child));
  }
  return { tagName: el.tagName.toLowerCase(), attributes: attrs, children };
}

/**
 * Serialize the direct children of the isolation element into a
 * transferable descriptor, recursing into their subtrees.
 */
function serializeChildren(host: HTMLElement): SerializedView[] {
  return Array.from(host.children).map(serializeElement);
}

/**
 * Recursively collect all `doc-url` attribute values from serialized views
 * that are valid automerge URLs. These become roots for the allowlist.
 */
function collectRootUrls(views: SerializedView[]): AutomergeUrl[] {
  const urls: AutomergeUrl[] = [];
  function walk(nodes: SerializedView[]) {
    for (const view of nodes) {
      const docUrl = view.attributes["doc-url"];
      if (docUrl && isValidAutomergeUrl(docUrl)) {
        urls.push(docUrl);
      }
      walk(view.children);
    }
  }
  walk(views);
  return urls;
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

      connectedCallback() {
        this.#init();
      }
      disconnectedCallback() {
        this.#teardown();
      }

      // ── Init ────────────────────────────────────────────────────

      async #init() {
        const epoch = ++this.#initEpoch;

        // Wait a microtask so the framework (e.g. Solid) finishes rendering
        // children with their reactive attributes before we serialize them.
        await Promise.resolve();
        if (epoch !== this.#initEpoch) return;

        // Serialize children before replacing them with the iframe
        const views = serializeChildren(this);
        const rootUrls = collectRootUrls(views);
        log(`init with ${views.length} views, ${rootUrls.length} root URLs`);

        if (views.length === 0) {
          log("no children to isolate");
          return;
        }

        // Remove host-side children — they've been serialized and will be
        // reconstructed inside the iframe. Leaving them causes duplicate
        // rendering in the host DOM alongside the iframe.
        this.replaceChildren();

        const repo = this.#getRepo();
        if (!repo) return;

        const assets = await this.#loadAssets(epoch);
        if (!assets) return;

        const importMap = getResolvedImportMap();
        const mapper = new PluginsUrlMapper();

        // ── Access control ──────────────────────────────────────
        const denylist = getDenylist(repo);

        const allowlist = new SyncAllowlist();
        this.#allowlist = allowlist;

        for (const url of rootUrls) {
          allowlist.add(url);
          log(`allowlisted root ${url}`);
        }

        // Allowlist the user's contact document so the patchwork:contact
        // bridge can relay it without prompting.
        const accountHandle = (window as any).accountDocHandle;
        const contactUrl = accountHandle?.doc()?.contactUrl;
        if (contactUrl && isValidAutomergeUrl(contactUrl)) {
          allowlist.add(contactUrl);
          log(`allowlisted contact ${contactUrl}`);
        }

        const allowlistCleanups = await populateAllowlistFromRoots(
          repo,
          rootUrls,
          allowlist,
          denylist,
          () => epoch !== this.#initEpoch
        );
        for (const cleanup of allowlistCleanups) {
          this.#cleanups.push(cleanup);
        }
        if (epoch !== this.#initEpoch) return;

        this.#intermediary = createIntermediaryRepo({
          allowlist,
          hostRepo: repo,
          denylist,
          onAccessRequest: async (documentId: DocumentId) => {
            // Unknown documents are NOT auto-allowlisted — the user is
            // prompted. This is a safe default: it prevents a tool from
            // silently gaining access to any URL it constructs. The cost is
            // that documents the iframe itself just created also prompt.
            // TODO: once the Author ID API is available, auto-allowlist
            // unknown documents whose author matches the iframe's assigned
            // author ID (the iframe created them) and continue to prompt for
            // all others.
            if (repo.handles[documentId]) {
              // Known to the host but not yet allowlisted — the URL may have
              // been added since the initial scan (e.g. the user typed a new
              // reference), so re-scan roots before asking. (Skipped for
              // unknown docs: a root re-scan can't surface a doc the host has
              // never seen, so it would be wasted work.)
              await refreshAllowlistFromRoots(
                repo,
                rootUrls,
                allowlist,
                denylist
              );
              if (allowlist.has(documentId)) return true;
            }

            const approved = window.confirm(
              `A tool wants to access a document:\n\n` +
                `Document ID: ${documentId}\n\n` +
                `This may be a document the tool just created, or one it is ` +
                `trying to open. Allow access?`
            );
            if (approved) {
              allowlist.addDocumentId(documentId);
            }
            return approved;
          },
        });

        log("intermediary repo and allowlist ready");

        // ── Bridged providers ────────────────────────────────────
        // Read the shared-providers attribute and intersect with
        // ALLOWED_PROVIDERS to get the effective set for this instance.
        const requestedProviders = (this.getAttribute("shared-providers") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const bridgedProviders: string[] = [];
        for (const type of requestedProviders) {
          if (ALLOWED_PROVIDERS.has(type)) {
            bridgedProviders.push(type);
          } else {
            console.warn(
              `[patchwork-isolation] shared-providers: "${type}" is not in ALLOWED_PROVIDERS. ` +
                `New provider types need independent security analysis before being added.`
            );
          }
        }

        // ── Host-side RPC ───────────────────────────────────────
        const rpcChannel = new MessageChannel();
        this.#hostRpcPort = rpcChannel.port1;

        this.#cleanups.push(
          startPluginsRpc({ port: this.#hostRpcPort, mapper }),
          startHostNavigationBridge(
            this.#hostRpcPort,
            this,
            (url) => this.#allowlist?.hasUrl(url) ?? false
          ),
          startHostProvidersBridge(
            this.#hostRpcPort,
            this,
            bridgedProviders,
            async (selectorType, value) => {
              // Check bridged values for automerge URLs that the iframe
              // doesn't already have access to.
              //
              // For patchwork:selected-doc: silently filter non-allowlisted
              // URLs. The semantic is "which of my allowlisted documents is
              // selected" — not "give me access to the selected document."
              // This avoids spurious prompts when the user navigates to a
              // new document (the old iframe is about to be torn down).
              //
              // For other types: prompt the user for unknown URLs.
              const silent = selectorType === "patchwork:selected-doc";

              async function checkUrl(url: string): Promise<boolean> {
                if (allowlist.hasUrl(url as AutomergeUrl)) return true;
                if (silent) return false;
                // Re-scan root documents in case the URL was added recently
                await refreshAllowlistFromRoots(repo!, rootUrls, allowlist, denylist);
                if (allowlist.hasUrl(url as AutomergeUrl)) return true;
                const approved = window.confirm(
                  `A bridged provider wants to share a document URL:\n\n` +
                    `URL: ${url}\n` +
                    `Provider: ${selectorType}\n\n` +
                    `Allow access?`
                );
                if (approved) {
                  allowlist.add(url as AutomergeUrl);
                  return true;
                }
                return false;
              }

              // Single automerge URL value
              if (typeof value === "string" && isValidAutomergeUrl(value)) {
                return (await checkUrl(value)) ? value : undefined;
              }

              // Array of values (may contain automerge URLs)
              if (Array.isArray(value)) {
                const result: unknown[] = [];
                for (const item of value) {
                  if (typeof item === "string" && isValidAutomergeUrl(item)) {
                    if (await checkUrl(item)) result.push(item);
                  } else {
                    result.push(item);
                  }
                }
                return result;
              }

              return value;
            }
          ),
          watchRegistries(this.#hostRpcPort, mapper)
        );

        // ── Iframe ──────────────────────────────────────────────
        this.#createIframe(epoch, rpcChannel.port2, this.#intermediary.iframePort, mapper, assets, {
          views,
          importMap,
        });

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
          views: SerializedView[];
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
            `sending boot message with ${registryEntries.length} registry entries, ${config.views.length} views`
          );
          iframe.contentWindow.postMessage(
            {
              type: "boot",
              views: config.views,
              registryEntries,
              esmsSource: assets.esmsSource,
              hostStyles: assets.hostStyles,
              importMap: config.importMap,
              hostOrigin: window.location.origin,
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
