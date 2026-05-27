/**
 * <isolated-patchwork-view> — renders a patchwork tool inside a srcdoc iframe.
 *
 * Same external interface as <patchwork-view> (attributes: doc-url;
 * events: patchwork:mounted, patchwork:open-document) but the tool runs in
 * an iframe with a null origin (srcdoc), no service worker, and no IndexedDB.
 *
 * Tool resolution is deferred to the iframe — the host never pre-resolves
 * which tool to use. Instead, the iframe requests tool information via a
 * PluginRegistryCapability granted through capnweb RPC.
 *
 * Plugin/tool source code is served through opaque URLs (`/__plugin__/...`)
 * that hide the underlying automerge document IDs. Automerge URLs never flow
 * from host to iframe — only from iframe to host (for document references).
 *
 * Host↔iframe communication uses capnweb RPC over MessagePort for type-safe
 * bidirectional method calls with object-capability semantics. A minimal
 * postMessage bootstrap loads capnweb itself before RPC takes over.
 */

import { type AutomergeUrl, type Repo, isValidAutomergeUrl } from "@automerge/automerge-repo";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";
import { RpcTarget, newMessagePortRpcSession } from "capnweb";
import type { RpcStub } from "capnweb";
import {
  getRegistry,
  getFallbackTool,
  getSupportedTools,
  getSupportedToolsForType,
  type LoadedTool,
} from "@inkandswitch/patchwork-plugins";
import { type HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import {
  getImportableUrlFromAutomergeUrl,
  resolvePackageExport,
} from "@inkandswitch/patchwork-filesystem";
import { MountedEvent, OpenDocumentEvent } from "../events.js";
import type {
  HostRpcContract,
  IframeRpcContract,
  PluginMetadata,
  PluginRegistryCapability,
} from "./rpc-types.js";
import { type ResourcePolicy, RestrictivePolicy } from "./resource-policy.js";
import getSrcdocHtml from "./srcdoc.js";

// ---------------------------------------------------------------------------
// Import map resolution
// ---------------------------------------------------------------------------

/** Resolve the host importmap entries to absolute URLs. */
function resolveImportMap(importMap: any, baseURI: string): any {
  const resolved: any = {};
  if (importMap.imports) {
    resolved.imports = {};
    for (const [key, value] of Object.entries(importMap.imports)) {
      try {
        resolved.imports[key] = new URL(value as string, baseURI).href;
      } catch {
        resolved.imports[key] = value;
      }
    }
  }
  if (importMap.scopes) {
    resolved.scopes = {};
    for (const [scopeKey, scopeMap] of Object.entries(importMap.scopes)) {
      let rk: string;
      try {
        rk = new URL(scopeKey, baseURI).href;
      } catch {
        rk = scopeKey;
      }
      resolved.scopes[rk] = {};
      for (const [k, v] of Object.entries(scopeMap as any)) {
        try {
          resolved.scopes[rk][k] = new URL(v as string, baseURI).href;
        } catch {
          resolved.scopes[rk][k] = v;
        }
      }
    }
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// Plugin entry point resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a plugin's automerge import URL to an absolute entry point URL.
 * The returned URL contains the automerge document ID in the path — the
 * OpaqueUrlMapper replaces this with an opaque token before exposing it
 * to the iframe.
 */
async function resolvePluginEntryUrl(
  importUrl: string
): Promise<string | undefined> {
  const folderPath = getImportableUrlFromAutomergeUrl(
    importUrl as AutomergeUrl
  );
  const base = new URL(folderPath, window.location.origin);
  const packageJsonUrl = new URL("package.json", base).href;

  const response = await fetch(packageJsonUrl);
  if (!response.ok) return undefined;

  const pkgJson = await response.json();
  const entryPoint = resolvePackageExport(pkgJson);
  if (!entryPoint) return undefined;

  return new URL(entryPoint, base).href;
}

// ---------------------------------------------------------------------------
// Opaque URL mapper — hides automerge document IDs from the iframe
// ---------------------------------------------------------------------------

/**
 * Replaces automerge document ID segments in URLs with opaque tokens to
 * hide tool source code locations from the iframe. The real URL
 * `http://host/%automerge%3Axyz.../dist/index.js` becomes
 * `http://host/__plugin__/p0/dist/index.js`.
 *
 * Uses standard URL parsing and `isValidAutomergeUrl` to identify automerge
 * segments rather than regex matching.
 */
class OpaqueUrlMapper {
  #counter = 0;
  #segmentToToken = new Map<string, string>();
  #tokenToSegment = new Map<string, string>();

  /**
   * Replace the automerge URL segment in a full URL with an opaque token.
   * If the segment hasn't been seen before, registers a new token.
   * Returns the URL unchanged if no automerge segment is found.
   */
  toOpaque(url: string): string {
    // Check if we've already mapped a segment in this URL
    for (const [segment, token] of this.#segmentToToken) {
      if (url.includes(`/${segment}/`)) {
        return url.replace(segment, `__plugin__/${token}`);
      }
    }
    // Not registered yet — find the automerge URL segment via URL parsing
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split("/").filter(Boolean);
      for (const segment of segments) {
        const decoded = decodeURIComponent(segment);
        if (isValidAutomergeUrl(decoded)) {
          const token = `p${this.#counter++}`;
          this.#segmentToToken.set(segment, token);
          this.#tokenToSegment.set(token, segment);
          return url.replace(segment, `__plugin__/${token}`);
        }
      }
    } catch {
      // not a valid URL, return as-is
    }
    return url;
  }

  /**
   * Replace the opaque token in a URL with the real automerge URL segment.
   * Returns null if no opaque token is found.
   */
  toReal(url: string): string | null {
    for (const [token, segment] of this.#tokenToSegment) {
      const opaqueSegment = `__plugin__/${token}`;
      if (url.includes(opaqueSegment)) {
        return url.replace(opaqueSegment, segment);
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// PluginRegistryTarget — capnweb capability for querying the plugin registry
// ---------------------------------------------------------------------------

/**
 * Host-side capability that the iframe receives as a capnweb stub. Each
 * method call is proxied back to this target on the host.
 */
class PluginRegistryTarget extends RpcTarget implements PluginRegistryCapability {
  #repo: Repo;
  #mapper: OpaqueUrlMapper;

  constructor(repo: Repo, mapper: OpaqueUrlMapper) {
    super();
    this.#repo = repo;
    this.#mapper = mapper;
  }

  /**
   * Convert a host-side plugin object to PluginMetadata with an opaque
   * importUrl. Returns null if the plugin has no importUrl or resolution fails.
   */
  async #toMetadata(plugin: any): Promise<PluginMetadata | null> {
    if (!plugin.importUrl) return null;

    const entryUrl = await resolvePluginEntryUrl(plugin.importUrl);
    if (!entryUrl) return null;

    const meta: PluginMetadata = {
      id: plugin.id,
      type: plugin.type,
      name: plugin.name,
      importUrl: this.#mapper.toOpaque(entryUrl),
    };

    if (plugin.icon != null) meta.icon = plugin.icon;
    if (plugin.unlisted != null) meta.unlisted = plugin.unlisted;
    if (plugin.supportedDatatypes != null) meta.supportedDatatypes = plugin.supportedDatatypes;
    if (plugin.tags != null) meta.tags = plugin.tags;
    if (plugin.forTitleBar != null) meta.forTitleBar = plugin.forTitleBar;

    return meta;
  }

  async list(pluginType: string): Promise<PluginMetadata[]> {
    const registry = getRegistry(pluginType);
    const all = registry.all();
    const results = await Promise.all(all.map((p) => this.#toMetadata(p)));
    return results.filter((m): m is PluginMetadata => m != null);
  }

  async get(pluginId: string): Promise<PluginMetadata | null> {
    // Search across known registry types
    for (const type of ["patchwork:tool", "patchwork:datatype"] as const) {
      const plugin = getRegistry(type).get(pluginId);
      if (plugin) return this.#toMetadata(plugin);
    }
    return null;
  }

  async getSupportedToolsForType(type: string): Promise<PluginMetadata[]> {
    const tools = getSupportedToolsForType(type);
    const results = await Promise.all(tools.map((t) => this.#toMetadata(t)));
    return results.filter((m): m is PluginMetadata => m != null);
  }

  async getFallbackTool(docUrl: string): Promise<PluginMetadata | null> {
    const handle = await this.#repo.find<HasPatchworkMetadata>(
      docUrl as AutomergeUrl
    );
    const doc = handle.doc();
    if (!doc) return null;

    const tool = getFallbackTool(doc);
    if (!tool) return null;

    return this.#toMetadata(tool);
  }

  async getSupportedTools(docUrl: string): Promise<PluginMetadata[]> {
    const handle = await this.#repo.find<HasPatchworkMetadata>(
      docUrl as AutomergeUrl
    );
    const doc = handle.doc();
    if (!doc) return [];

    const tools = getSupportedTools(doc);
    const results = await Promise.all(tools.map((t) => this.#toMetadata(t)));
    return results.filter((m): m is PluginMetadata => m != null);
  }
}

// ---------------------------------------------------------------------------
// HostApi — root RPC target exposed to the iframe
// ---------------------------------------------------------------------------

/**
 * Host-side RPC target exposed to the isolated iframe via capnweb.
 * The iframe calls these methods through its RpcStub<HostRpcContract>.
 */
class HostApi extends RpcTarget implements HostRpcContract {
  #element: HTMLElement;
  #policy: ResourcePolicy;
  #repo: Repo;
  #mapper: OpaqueUrlMapper;
  #registryTarget: PluginRegistryTarget;

  constructor(
    element: HTMLElement,
    policy: ResourcePolicy,
    repo: Repo,
    mapper: OpaqueUrlMapper
  ) {
    super();
    this.#element = element;
    this.#policy = policy;
    this.#repo = repo;
    this.#mapper = mapper;
    this.#registryTarget = new PluginRegistryTarget(repo, mapper);
  }

  getPluginRegistry(): PluginRegistryCapability {
    return this.#registryTarget;
  }

  #checkPolicy(url: string): void {
    if (!this.#policy.canFetch(url)) {
      console.warn(`[isolated-patchwork-view] policy denied: ${url}`);
      throw new Error(`Access denied: ${url}`);
    }
  }

  async loadModuleSource(url: string): Promise<string> {
    // Resolve opaque __plugin__ URLs back to real automerge-backed paths
    const realUrl = this.#mapper.toReal(url);
    if (realUrl) {
      return fetch(realUrl).then((r) => r.text());
    }
    this.#checkPolicy(url);
    return fetch(url).then((r) => r.text());
  }

  async fetchResource(
    url: string
  ): Promise<{ contentType: string; body: string | Uint8Array }> {
    // Resolve opaque URLs for fetch too (e.g., CSS, images from tool packages)
    const realUrl = this.#mapper.toReal(url) ?? url;
    if (!this.#mapper.toReal(url)) {
      this.#checkPolicy(url);
    }
    const res = await fetch(realUrl);
    const contentType = res.headers.get("content-type") || "";
    const isBinary =
      contentType.includes("wasm") || contentType.includes("octet-stream");
    if (isBinary) {
      const buf = await res.arrayBuffer();
      return { contentType, body: new Uint8Array(buf) };
    }
    const body = await res.text();
    return { contentType, body };
  }

  onMounted(url: string, toolId: string): void {
    this.#element.dispatchEvent(
      new MountedEvent({ url: url as AutomergeUrl, toolId })
    );
  }

  onOpenDocument(
    url: string,
    toolId?: string,
    title?: string,
    docType?: string
  ): void {
    this.#element.dispatchEvent(
      new OpenDocumentEvent({
        url: url as AutomergeUrl,
        toolId,
        title,
        type: docType,
      })
    );
  }
}

// ---------------------------------------------------------------------------
// Custom element registration
// ---------------------------------------------------------------------------

export interface RegisterIsolatedPatchworkViewElementParams {
  name?: string;
  repo: Repo;
  /**
   * Optional resource policy factory. Receives the host origin and the set of
   * resolved importmap URLs so the policy can make allowlist decisions.
   * Defaults to RestrictivePolicy (blocks cross-origin and automerge URL paths).
   */
  createPolicy?: (hostOrigin: string, importMapUrls: Set<string>) => ResourcePolicy;
}

export interface IsolatedPatchworkViewElement extends HTMLElement {
  repo: Repo;
  docUrl?: AutomergeUrl;
  toolId?: string;
}

export function registerIsolatedPatchworkViewElement(
  params: RegisterIsolatedPatchworkViewElementParams
) {
  const elementName = params.name ?? "isolated-patchwork-view";
  const repo = params.repo;
  const createPolicy = params.createPolicy ??
    ((hostOrigin: string, importMapUrls: Set<string>) =>
      new RestrictivePolicy(hostOrigin, importMapUrls));

  if (customElements.get(elementName)) {
    console.error(`can't redefine custom element "${elementName}"`);
    return;
  }

  const attrs = {
    docUrl: "doc-url",
    toolId: "tool-id",
  };

  customElements.define(
    elementName,
    class IsolatedPatchworkViewElement extends HTMLElement {
      #docUrl: AutomergeUrl | null = null;
      #toolId: string | null = null;
      #iframe: HTMLIFrameElement | null = null;
      #repoChannel: MessageChannel | null = null;
      #rpcChannel: MessageChannel | null = null;
      #iframeStub: RpcStub<IframeRpcContract> | null = null;
      #initEpoch = 0;
      #readyHandler: ((e: MessageEvent) => void) | null = null;
      #bootstrapChannel: MessageChannel | null = null;

      get docUrl() {
        return this.#docUrl;
      }

      set docUrl(url: AutomergeUrl | null) {
        if (this.#docUrl === url) return;
        this.#docUrl = url;
        if (url) this.setAttribute(attrs.docUrl, url);
        else this.removeAttribute(attrs.docUrl);
      }

      get toolId() {
        return this.#toolId;
      }

      set toolId(id: string | null) {
        if (this.#toolId === id) return;
        this.#toolId = id;
        if (id) this.setAttribute(attrs.toolId, id);
        else this.removeAttribute(attrs.toolId);
      }

      static get observedAttributes() {
        return [attrs.docUrl, attrs.toolId];
      }

      connectedCallback() {
        if (!this.style.position) {
          this.style.position = "relative";
        }
        this.style.display = "block";

        this.#docUrl = this.getAttribute(attrs.docUrl) as AutomergeUrl;
        this.#toolId = this.getAttribute(attrs.toolId);
        this.#init();
      }

      disconnectedCallback() {
        this.#teardown();
      }

      attributeChangedCallback(
        name: string,
        old: string | null,
        val: string | null
      ) {
        if (old === val) return;

        if (name === attrs.toolId) {
          this.#toolId = val;
        } else if (name === attrs.docUrl) {
          this.#docUrl = val as AutomergeUrl;
        }

        this.#teardown();
        this.#init();
      }

      async #init() {
        if (!this.#docUrl) return;
        if (this.#iframe) return;

        const epoch = ++this.#initEpoch;
        const docUrl = this.#docUrl;
        const toolId = this.#toolId;

        // Pre-fetch tool-independent assets in parallel (the sandboxed
        // iframe cannot fetch anything itself).
        const esmsUrl =
          "https://ga.jspm.io/npm:es-module-shims@2.8.1/dist/es-module-shims.wasm.js";

        // Collect host page stylesheets so tools inside the iframe get the
        // same CSS framework (Tailwind/DaisyUI utility classes, etc.).
        const hostStyles = await Promise.all(
          Array.from(document.styleSheets).map(async (sheet) => {
            try {
              // Inline <style> tags — read cssRules directly
              return Array.from(sheet.cssRules)
                .map((r) => r.cssText)
                .join("\n");
            } catch {
              // Cross-origin <link> stylesheets — fetch the href
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
        ).then((sheets) => sheets.filter(Boolean).join("\n"));

        const [esmsSource, automergeWasm, subductionWasm] = await Promise.all([
          fetch(esmsUrl).then((r) => r.text()),
          fetch("/automerge.wasm").then((r) => r.arrayBuffer()),
          fetch("/subduction.wasm").then((r) => r.arrayBuffer()),
        ]);
        if (epoch !== this.#initEpoch) return;

        // Create srcdoc iframe with sandbox for security isolation
        const iframe = document.createElement("iframe");
        iframe.sandbox.add("allow-scripts");
        iframe.srcdoc = getSrcdocHtml(window.location.origin);
        iframe.style.cssText =
          "position:absolute;inset:0;border:none;width:100%;height:100%;";
        this.appendChild(iframe);
        this.#iframe = iframe;

        // Wait for iframe to signal readiness
        await new Promise<void>((resolve) => {
          const handler = (e: MessageEvent) => {
            if (e.data?.type !== "isolated-patchwork-ready") return;
            if (e.source !== iframe.contentWindow) return;
            window.removeEventListener("message", handler);
            this.#readyHandler = null;
            resolve();
          };
          this.#readyHandler = handler;
          window.addEventListener("message", handler);
        });

        if (epoch !== this.#initEpoch) return;

        // Resolve importmap to absolute host-origin URLs (needed before
        // bootstrap channel setup to restrict which URLs it can serve).
        const importMapEl = document.querySelector('script[type="importmap"]');
        const rawImportMap = importMapEl
          ? JSON.parse(importMapEl.textContent || "{}")
          : { imports: {} };
        const importMap = resolveImportMap(rawImportMap, document.baseURI);

        // Collect the set of URLs the bootstrap channel is allowed to serve.
        const allowedBootstrapUrls = new Set<string>();
        if (importMap.imports) {
          for (const url of Object.values(importMap.imports)) {
            allowedBootstrapUrls.add(url as string);
          }
        }

        // Bootstrap channel — handles module loading before capnweb RPC is
        // ready. Only importmap URLs are allowed.
        const bootstrapChannel = new MessageChannel();
        bootstrapChannel.port1.onmessage = async (e) => {
          const { id, type, url } = e.data;
          if (type !== "load-module-source") return;
          if (!allowedBootstrapUrls.has(url)) {
            console.warn(
              `[isolated-patchwork-view] bootstrap denied: ${url}`
            );
            bootstrapChannel.port1.postMessage({
              id,
              ok: false,
              error: `Bootstrap: URL not in importmap: ${url}`,
            });
            return;
          }
          try {
            const source = await fetch(url).then((r) => r.text());
            bootstrapChannel.port1.postMessage({ id, ok: true, value: source });
          } catch (err) {
            bootstrapChannel.port1.postMessage({
              id,
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        };
        bootstrapChannel.port1.start();
        this.#bootstrapChannel = bootstrapChannel;

        // Connect iframe repo directly to host repo via MessageChannel
        const repoChannel = new MessageChannel();
        repo.networkSubsystem.addNetworkAdapter(
          new MessageChannelNetworkAdapter(repoChannel.port1, {
            useWeakRef: true,
          })
        );
        this.#repoChannel = repoChannel;

        // Set up capnweb RPC channel with the HostApi and opaque URL mapper.
        const rpcChannel = new MessageChannel();
        const policy = createPolicy(window.location.origin, allowedBootstrapUrls);
        const mapper = new OpaqueUrlMapper();
        const hostApi = new HostApi(this, policy, repo, mapper);
        this.#iframeStub = newMessagePortRpcSession<IframeRpcContract>(
          rpcChannel.port1,
          hostApi
        );
        this.#rpcChannel = rpcChannel;

        // Send init message with transferred ports and pre-fetched assets.
        // Tool resolution is deferred — the iframe will request it via the
        // PluginRegistryCapability after RPC is established.
        iframe.contentWindow!.postMessage(
          {
            type: "isolated-patchwork-init",
            docUrl,
            toolId,
            importMap,
            hostOrigin: window.location.origin,
            hostStyles,
            esmsSource,
            automergeWasm,
            subductionWasm,
          },
          "*",
          [
            repoChannel.port2,
            bootstrapChannel.port2,
            rpcChannel.port2,
            automergeWasm,
            subductionWasm,
          ]
        );
      }

      #teardown() {
        this.#initEpoch++;

        if (this.#readyHandler) {
          window.removeEventListener("message", this.#readyHandler);
          this.#readyHandler = null;
        }

        if (this.#repoChannel) {
          this.#repoChannel.port1.close();
          this.#repoChannel.port2.close();
          this.#repoChannel = null;
        }

        if (this.#bootstrapChannel) {
          this.#bootstrapChannel.port1.close();
          this.#bootstrapChannel.port2.close();
          this.#bootstrapChannel = null;
        }

        if (this.#rpcChannel) {
          this.#rpcChannel.port1.close();
          this.#rpcChannel.port2.close();
          this.#rpcChannel = null;
        }

        this.#iframeStub = null;

        if (this.#iframe) {
          this.#iframe.remove();
          this.#iframe = null;
        }
      }
    }
  );
}
