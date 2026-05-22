/**
 * <isolated-patchwork-view> — renders a patchwork tool inside a srcdoc iframe.
 *
 * Same external interface as <patchwork-view> (attributes: doc-url, tool-id;
 * events: patchwork:mounted, patchwork:open-document) but the tool runs in
 * an iframe with a null origin (srcdoc), no service worker, and no IndexedDB.
 *
 * The host resolves the tool's module URL and importmap to absolute URLs.
 * The iframe uses es-module-shims to load modules from the host origin.
 * Document sync happens via a direct MessageChannel connection to the host repo.
 *
 * Host↔iframe communication uses capnweb RPC over MessagePort for type-safe
 * bidirectional method calls with object-capability semantics. A minimal
 * postMessage bootstrap loads capnweb itself before RPC takes over.
 */

import { type AutomergeUrl, type Repo } from "@automerge/automerge-repo";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";
import { RpcTarget, newMessagePortRpcSession } from "capnweb";
import type { RpcStub } from "capnweb";
import {
  getRegistry,
  getFallbackTool,
  type LoadedTool,
} from "@inkandswitch/patchwork-plugins";
import { type HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import {
  getImportableUrlFromAutomergeUrl,
  resolvePackageExport,
} from "@inkandswitch/patchwork-filesystem";
import { MountedEvent, OpenDocumentEvent } from "../events.js";
import type { HostRpcContract, IframeRpcContract } from "./rpc-types.js";
import { type ResourcePolicy, AllowAllPolicy } from "./resource-policy.js";
import getSrcdocHtml from "./srcdoc.js";

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

/**
 * Resolve a tool's automerge folder URL to an absolute entry point URL.
 * This runs on the host side where window.location.origin is valid.
 */
async function resolveToolEntryUrl(
  toolImportUrl: string
): Promise<string | undefined> {
  const folderPath = getImportableUrlFromAutomergeUrl(
    toolImportUrl as AutomergeUrl
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

/**
 * Host-side RPC target exposed to the isolated iframe via capnweb.
 * The iframe calls these methods through its RpcStub<HostRpcContract>.
 */
class HostApi extends RpcTarget implements HostRpcContract {
  #element: HTMLElement;
  #policy: ResourcePolicy;

  constructor(element: HTMLElement, policy: ResourcePolicy) {
    super();
    this.#element = element;
    this.#policy = policy;
  }

  #checkPolicy(url: string): void {
    if (!this.#policy.canFetch(url)) {
      console.warn(
        `[isolated-patchwork-view] policy denied: ${url}`
      );
      throw new Error(`Access denied: ${url}`);
    }
  }

  async loadModuleSource(url: string): Promise<string> {
    this.#checkPolicy(url);
    return fetch(url).then((r) => r.text());
  }

  async fetchResource(
    url: string
  ): Promise<{ contentType: string; body: string | Uint8Array }> {
    this.#checkPolicy(url);
    const res = await fetch(url);
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

export interface RegisterIsolatedPatchworkViewElementParams {
  name?: string;
  repo: Repo;
  /** Optional factory to create per-tool resource policies. Defaults to AllowAllPolicy. */
  createPolicy?: (toolId: string) => ResourcePolicy;
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
  const createPolicy = params.createPolicy ?? (() => new AllowAllPolicy());

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
        let toolId = this.#toolId;
        const docUrl = this.#docUrl;

        // Resolve which tool module to load.
        let toolImportUrl: string | undefined;
        if (toolId) {
          const registeredTool =
            getRegistry<LoadedTool>("patchwork:tool").get(toolId);
          if (registeredTool?.importUrl) {
            toolImportUrl = registeredTool.importUrl;
          }
        }
        if (!toolImportUrl) {
          const handle = await repo.find<HasPatchworkMetadata>(docUrl);
          if (epoch !== this.#initEpoch) return;
          const fallback = getFallbackTool(handle.doc());
          toolImportUrl = fallback?.importUrl;
          if (!toolId && fallback?.id) {
            toolId = fallback.id;
          }
        }

        if (!toolId) return;

        // Resolve tool entry point URL on the host side, and pre-fetch
        // es-module-shims source + WASM buffers in parallel (the sandboxed
        // iframe cannot fetch anything itself).
        let toolEntryUrl: string | undefined;
        const esmsUrl =
          "https://ga.jspm.io/npm:es-module-shims@2.8.1/dist/es-module-shims.wasm.js";

        const [resolvedToolEntry, esmsSource, automergeWasm, subductionWasm] =
          await Promise.all([
            toolImportUrl
              ? resolveToolEntryUrl(toolImportUrl)
              : Promise.resolve(undefined),
            fetch(esmsUrl).then((r) => r.text()),
            fetch("/automerge.wasm").then((r) => r.arrayBuffer()),
            fetch("/subduction.wasm").then((r) => r.arrayBuffer()),
          ]);
        if (epoch !== this.#initEpoch) return;
        toolEntryUrl = resolvedToolEntry;

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
        // Only importmap entry values are permitted — this ensures the
        // bootstrap channel can load capnweb (and its importmap peers) but
        // nothing else.
        const allowedBootstrapUrls = new Set<string>();
        if (importMap.imports) {
          for (const url of Object.values(importMap.imports)) {
            allowedBootstrapUrls.add(url as string);
          }
        }

        // Bootstrap channel — handles the iframe's requests to load module
        // source during the bootstrap phase (before capnweb RPC is ready).
        // Once the iframe has loaded capnweb via this channel and established
        // its RPC session, all further communication goes over capnweb RPC.
        // Only importmap URLs are allowed.
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

        // Set up capnweb RPC channel — the HostApi handles module loading,
        // fetch proxying, and event callbacks from the iframe.
        const rpcChannel = new MessageChannel();
        const policy = createPolicy(toolId);
        const hostApi = new HostApi(this, policy);
        this.#iframeStub = newMessagePortRpcSession<IframeRpcContract>(
          rpcChannel.port1,
          hostApi
        );
        this.#rpcChannel = rpcChannel;

        // Send init message with transferred ports and pre-fetched assets.
        // Three ports are transferred:
        //   [0] repoPort     — Automerge document sync
        //   [1] bootstrapPort — one-shot module loading (to load capnweb)
        //   [2] rpcPort       — capnweb RPC (used after bootstrap)
        iframe.contentWindow!.postMessage(
          {
            type: "isolated-patchwork-init",
            docUrl,
            toolId,
            toolEntryUrl,
            importMap,
            hostOrigin: window.location.origin,
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
