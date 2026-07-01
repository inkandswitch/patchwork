/**
 * `<patchwork-isolation>` — mounts an isolated root component inside a sandboxed
 * iframe with data access mediated by an intermediary repo and allowlist.
 *
 * The element renders nothing on its own and never inspects its light DOM. The
 * host hands it a serializable boot spec via the imperative `configure()` method:
 *
 *   const el = document.createElement("patchwork-isolation");
 *   el.configure({
 *     rootComponentId: "threepane-document-area",
 *     props: { selectedDocUrl, traySlots, ... },  // structured-clone JSON only
 *     rootUrls: [selectedDocUrl, contactUrl],      // allowlist seeds
 *   });
 *
 * The spec is data only — no live DOM, no functions. Tool code therefore never
 * runs in the host realm: the iframe resolves `rootComponentId` against its own
 * registry and mounts it. Any later `configure()` with a different spec tears the
 * iframe down and boots a fresh one (no diffing, no in-place re-pointing).
 *
 * Lifecycle (per boot):
 *  1. Fetch boot assets (es-module-shims, WASM, host styles) — cached
 *  2. Get shared denylist (singleton, populated once from sensitive docs)
 *  3. Create allowlist seeded from `spec.rootUrls` (+ populated from doc content)
 *  4. Create intermediary repo gated by allowlist + denylist
 *  5. Start host-side RPC for plugin loading, navigation, and bridged providers
 *  6. Create sandboxed iframe and send boot message (rootComponentId + props +
 *     registry entries)
 *
 * Register at boot time via `registerPatchworkIsolationElement()`.
 */

import type { AutomergeUrl, Repo } from "@automerge/automerge-repo";
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
import {
  buildAllowlist,
  handleAccessRequest,
  requestBridgedUrlAccess,
  getDenylist,
} from "./access-control.js";
import { startHostNavigationBridge } from "./navigation-bridge.js";
import {
  startHostProvidersBridge,
  resolveBridgedProviders,
  makeBridgedValueFilter,
} from "./providers-bridge.js";
import { generateIframeSrcdoc } from "./iframe-bootstrap.js";
import type { IsolationBootSpec } from "./types.js";
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

export interface PatchworkIsolationElement extends HTMLElement {
  /**
   * Boot (or re-boot) the isolated iframe from a serializable spec. Stored and
   * deferred if the element is disconnected; applied on connect. A later call
   * with a different spec tears down the existing iframe and boots a fresh one;
   * a byte-identical spec is a no-op.
   */
  configure(spec: IsolationBootSpec): void;
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
/**
 * The host's current appearance, read off the live page so the iframe can match
 * it from its very first paint (avoiding a flash of unstyled white before the
 * theming tool boots inside the iframe).
 *
 * Both values are read tool-agnostically — as *resolved* browser values, not
 * via any theming tool's CSS variables, attribute conventions, or palette. The
 * platform must not depend on which theming tool (if any) is installed:
 *  - `background` is the host's actual painted background, found by walking up
 *    from the isolation element to the first ancestor with a non-transparent
 *    computed `backgroundColor` (whatever produced it). Empty if none.
 *  - `colorScheme` is the resolved `color-scheme` (a CSS standard property) so
 *    the iframe's scrollbars/form controls match. Empty if unset.
 *
 * The real theme is applied to the iframe's content later, when the theming
 * tool boots inside it; this only paints the first frame so it doesn't flash.
 */
interface HostAppearance {
  background: string;
  colorScheme: string;
}

function readHostAppearance(el: Element): HostAppearance {
  // Walk ancestors for the first real (non-transparent) background. The visible
  // backdrop behind the iframe is painted by some ancestor (e.g. a frame
  // container); we mirror its resolved color without knowing which element or
  // how it was themed.
  let background = "";
  for (let node: Element | null = el; node; node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== "transparent" && !bg.startsWith("rgba(0, 0, 0, 0)")) {
      background = bg;
      break;
    }
  }

  const colorScheme = getComputedStyle(document.documentElement).colorScheme;
  return {
    background,
    // "normal" is the unset default — don't emit it.
    colorScheme: colorScheme && colorScheme !== "normal" ? colorScheme : "",
  };
}

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
// Spec equality
// ---------------------------------------------------------------------------

/**
 * Structural equality for two boot specs. `props` is structured-clone JSON and
 * `rootUrls` is computed deterministically by the host, so a stable JSON
 * stringify is a sound and cheap comparison — it lets `configure()` ignore a
 * host that recomputes and re-hands an unchanged spec, avoiding a needless
 * (expensive) iframe reboot.
 */
function specsEqual(a: IsolationBootSpec, b: IsolationBootSpec): boolean {
  if (a.rootComponentId !== b.rootComponentId) return false;
  if (a.rootUrls.length !== b.rootUrls.length) return false;
  for (let i = 0; i < a.rootUrls.length; i++) {
    if (a.rootUrls[i] !== b.rootUrls[i]) return false;
  }
  return JSON.stringify(a.props) === JSON.stringify(b.props);
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
      // Teardown callbacks registered during #init (host-side RPC handlers,
      // bridges, the registry watcher). All are run, then cleared, in #teardown.
      #cleanups: Array<() => void> = [];
      // True once #init has fully completed. #teardown is a no-op before then
      // (see the guard there): nothing is wired up until the very end of #init,
      // which bails out at the first stale-epoch check after any failed step.
      #booted = false;
      // Monotonic init counter. Each #init / #teardown bumps it; async steps in
      // #init re-check it after every await and abort if it changed, so a
      // disconnect (or rapid reconnect) can't let a stale init keep running.
      #initEpoch = 0;
      // The spec the element is (or should be) booted from. Set by configure();
      // applied on connect. Persists across disconnect/reconnect so a detached
      // configure() boots once reconnected.
      #spec: IsolationBootSpec | null = null;

      connectedCallback() {
        // Boot from a spec configured while disconnected (or before connect).
        if (this.#spec) this.#init(this.#spec);
      }
      disconnectedCallback() {
        this.#teardown();
      }

      // ── Configure ───────────────────────────────────────────────

      configure(spec: IsolationBootSpec) {
        // Skip a redundant reconfigure with a byte-identical spec — the host may
        // recompute and re-hand an unchanged spec on unrelated state changes, and
        // a reboot is expensive (module re-fetch + WASM re-init).
        if (this.#spec && specsEqual(this.#spec, spec)) {
          log("configure: spec unchanged, ignoring");
          return;
        }
        this.#spec = spec;
        if (!this.isConnected) {
          log("configure: stored (disconnected); will boot on connect");
          return;
        }
        // A real change while connected: tear down the running iframe and boot
        // fresh. #teardown is a no-op if nothing is booted yet.
        this.#teardown();
        this.#init(spec);
      }

      // ── Init ────────────────────────────────────────────────────

      async #init(spec: IsolationBootSpec) {
        const epoch = ++this.#initEpoch;

        const rootUrls = spec.rootUrls;
        log(
          `init root "${spec.rootComponentId}" with ${rootUrls.length} root URLs`
        );

        const repo = this.#getRepo();
        if (!repo) return;

        const assets = await this.#loadAssets(epoch);
        if (!assets) return;

        const importMap = getResolvedImportMap();
        const mapper = new PluginsUrlMapper();

        // ── Access control ──────────────────────────────────────
        // Wait for the denylist to finish populating before seeding the
        // allowlist or creating the intermediary repo. Otherwise a protected
        // doc that appears in root content could be allowlisted/synced during
        // the population window (the denylist is built asynchronously).
        const denylist = getDenylist(repo);
        await denylist.whenReady();
        if (this.#stale(epoch)) return;

        const allowlist = await buildAllowlist(repo, rootUrls, denylist, () =>
          this.#stale(epoch)
        );
        if (this.#stale(epoch)) return;
        this.#allowlist = allowlist;

        this.#intermediary = createIntermediaryRepo({
          allowlist,
          hostRepo: repo,
          denylist,
          onAccessRequest: (documentId) =>
            handleAccessRequest(repo, rootUrls, allowlist, denylist, documentId),
        });

        log("intermediary repo and allowlist ready");

        // ── Bridged providers ────────────────────────────────────
        // The effective set for this instance: shared-providers ∩
        // ALLOWED_PROVIDERS (see providers-bridge).
        const bridgedProviders = resolveBridgedProviders(this);

        // The bridge filters URLs in bridged values against the allowlist; the
        // silent-vs-prompt policy per provider type lives in the bridge.
        const bridgedValueFilter = makeBridgedValueFilter({
          isAllowed: (url) => allowlist.hasUrl(url as AutomergeUrl),
          requestAccess: (url) =>
            requestBridgedUrlAccess(
              repo,
              rootUrls,
              allowlist,
              denylist,
              url as AutomergeUrl
            ),
        });

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
            bridgedValueFilter
          ),
          watchRegistries(this.#hostRpcPort, mapper)
        );

        // ── Iframe ──────────────────────────────────────────────
        this.#createIframe(
          epoch,
          rpcChannel.port2,
          this.#intermediary.iframePort,
          mapper,
          assets,
          {
            rootComponentId: spec.rootComponentId,
            props: spec.props,
            importMap,
          }
        );

        this.#booted = true;
      }

      // ── Helpers ─────────────────────────────────────────────────

      // Whether this init run has been superseded. #init captures its epoch up
      // front; a later #teardown or reconfigure bumps #initEpoch, so any async
      // step can re-check this after an await and bail before mutating state.
      #stale(epoch: number): boolean {
        return epoch !== this.#initEpoch;
      }

      // The host repo is provided by the nearest <repo-provider> ancestor (the
      // app bootloader mounts one). The intermediary repo syncs from it.
      #getRepo(): Repo | undefined {
        const repoProvider = this.closest<RepoProviderElement>("repo-provider");
        const repo = repoProvider?.repo;
        if (!repo) log("no <repo-provider> ancestor found");
        return repo;
      }

      async #loadAssets(epoch: number): Promise<BootAssets | undefined> {
        try {
          const assets = await fetchBootAssets();
          if (this.#stale(epoch)) return undefined;
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
          rootComponentId: string;
          props: Record<string, unknown>;
          importMap: ImportMap;
        }
      ) {
        const iframe = document.createElement("iframe");
        iframe.sandbox.add("allow-scripts");
        iframe.style.cssText =
          "border: none; width: 100%; height: 100%; display: block;";
        // Bake the host's current background + color-scheme into the srcdoc so
        // the iframe's first paint matches the host (no flash of white before
        // the theming tool boots inside the iframe). Read tool-agnostically off
        // the live element — `this` is still connected, so its ancestors carry
        // the host background.
        iframe.srcdoc = generateIframeSrcdoc(readHostAppearance(this));
        this.#iframe = iframe;

        iframe.addEventListener("load", async () => {
          if (!this.#booted || this.#stale(epoch)) return;
          if (!iframe.contentWindow) return;
          log("iframe ready");

          const registryEntries = await getRegistries(mapper);
          if (!this.#booted || this.#stale(epoch)) return;

          const automergeWasm = assets.automergeWasm.slice(0);
          const subductionWasm = assets.subductionWasm.slice(0);

          log(
            `sending boot message with ${registryEntries.length} registry entries, root "${config.rootComponentId}"`
          );
          iframe.contentWindow.postMessage(
            {
              type: "boot",
              rootComponentId: config.rootComponentId,
              props: config.props,
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
