/**
 * <isolated-patchwork-view> — renders a patchwork tool inside a srcdoc iframe.
 *
 * Same external interface as <patchwork-view> (attributes: doc-url, tool-id;
 * events: patchwork:mounted, patchwork:open-document) but the tool runs in
 * an iframe with a null origin (srcdoc), no service worker, and no IndexedDB.
 *
 * The host resolves the tool's module URL and importmap to absolute URLs.
 * The iframe uses es-module-shims to load modules from the host origin.
 * Document sync happens via a filtered bridge over MessagePort.
 */

import { type AutomergeUrl, type Repo } from "@automerge/automerge-repo";
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
import {
  createFilteredBridge,
  type FilteredBridge,
} from "./filtered-bridge.js";
import { setupRpc } from "./rpc.js";
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
 * Resolve a tool's automerge folder URL to a blob URL with rewritten imports.
 *
 * The host fetches the tool's entry point JS through its service worker,
 * rewrites all relative imports to absolute automerge URLs, and returns a
 * blob URL. This allows the sandboxed iframe to load the module without
 * needing to resolve relative paths (which fail with blob/srcdoc base URLs).
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

  const entryUrl = new URL(entryPoint, base).href;
  const entryBase = entryUrl.substring(0, entryUrl.lastIndexOf("/") + 1);

  // Fetch the entry point source through the host's SW
  const sourceResponse = await fetch(entryUrl);
  if (!sourceResponse.ok) return undefined;
  let source = await sourceResponse.text();

  // Rewrite relative imports to absolute automerge URLs so the sandboxed
  // iframe's fetch proxy can handle them. Covers:
  //   import("./path")  import('./path')  from "./path"  from './path'
  source = source.replace(
    /(from\s+|import\s*\()(['"])(\.\.?\/[^'"]+)\2/g,
    (_match, prefix, quote, relativePath) => {
      const absoluteUrl = new URL(relativePath, entryBase).href;
      return prefix + quote + absoluteUrl + quote;
    }
  );

  // Return the rewritten source as a string — the iframe will create its own
  // blob URL (blob URLs are origin-scoped and can't cross the sandbox boundary)
  return source;
}

export interface RegisterIsolatedPatchworkViewElementParams {
  name?: string;
  repo: Repo;
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
      #bridge: FilteredBridge | null = null;
      #rpc: { navigate(docUrl: string, toolId: string): void } | null = null;
      #initEpoch = 0;
      #readyHandler: ((e: MessageEvent) => void) | null = null;

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
          this.#teardown();
          this.#init();
        } else if (name === attrs.docUrl) {
          this.#docUrl = val as AutomergeUrl;
          if (this.#rpc && this.#toolId) {
            this.#bridge?.allow(this.#docUrl!);
            this.#rpc.navigate(this.#docUrl!, this.#toolId);
          } else {
            this.#teardown();
            this.#init();
          }
        }
      }

      async #init() {
        if (!this.#docUrl) return;
        if (this.#iframe) return;

        const epoch = ++this.#initEpoch;
        let toolId = this.#toolId;
        const docUrl = this.#docUrl;

        // Resolve which tool module to load.
        // If tool-id is specified, look it up in the registry.
        // Otherwise, determine the fallback tool from the document's datatype.
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

        // Resolve tool entry point URL on the host side
        // (packages.ts uses window.location.origin which is null in srcdoc)
        let toolEntryUrl: string | undefined;
        if (toolImportUrl) {
          toolEntryUrl = await resolveToolEntryUrl(toolImportUrl);
          if (epoch !== this.#initEpoch) return;
        }

        // Create srcdoc iframe with sandbox for security isolation
        const iframe = document.createElement("iframe");
        iframe.sandbox.add("allow-scripts");
        iframe.srcdoc = getSrcdocHtml();
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

        // Create filtered bridge
        const bridge = createFilteredBridge(repo, [docUrl]);
        this.#bridge = bridge;

        // Create RPC channel
        const rpcChannel = new MessageChannel();

        // Set up RPC
        this.#rpc = setupRpc(rpcChannel.port1, {
          onRequestDocument: async (
            requestedDocUrl: string,
            reason: string
          ) => {
            console.warn(
              `[isolated-patchwork-view] tool "${toolId}" requests document access:`,
              requestedDocUrl,
              reason
            );
            bridge.allow(requestedDocUrl as AutomergeUrl);
            return true;
          },
          onOpenDocument: (
            url: string,
            openToolId: string,
            title: string,
            type: string
          ) => {
            this.dispatchEvent(
              new OpenDocumentEvent({
                url: url as AutomergeUrl,
                toolId: openToolId,
                title,
                type,
              })
            );
          },
          onMounted: (url: string, mountedToolId: string) => {
            this.dispatchEvent(
              new MountedEvent({
                url: url as AutomergeUrl,
                toolId: mountedToolId,
              })
            );
          },
        });

        // Create fetch proxy channel — the iframe proxies automerge URL
        // fetches through the host, which has a service worker that can
        // resolve them.
        const fetchChannel = new MessageChannel();
        fetchChannel.port1.onmessage = async (event) => {
          const { id, url } = event.data;
          try {
            const response = await fetch(url);
            const body = await response.arrayBuffer();
            const headers: Record<string, string> = {};
            response.headers.forEach((value, key) => {
              headers[key] = value;
            });
            fetchChannel.port1.postMessage(
              { id, status: response.status, headers, body },
              [body]
            );
          } catch {
            fetchChannel.port1.postMessage({
              id,
              status: 500,
              headers: {},
              body: new ArrayBuffer(0),
            });
          }
        };
        fetchChannel.port1.start();

        // Resolve importmap to absolute host-origin URLs
        const importMapEl = document.querySelector('script[type="importmap"]');
        const rawImportMap = importMapEl
          ? JSON.parse(importMapEl.textContent || "{}")
          : { imports: {} };
        const importMap = resolveImportMap(rawImportMap, document.baseURI);

        // Send init message with transferred ports (repo, rpc, fetch proxy)
        iframe.contentWindow!.postMessage(
          {
            type: "isolated-patchwork-init",
            docUrl,
            toolId,
            toolEntryUrl,
            importMap,
            hostOrigin: window.location.origin,
          },
          "*",
          [bridge.iframePort, rpcChannel.port2, fetchChannel.port2]
        );
      }

      #teardown() {
        this.#initEpoch++;

        if (this.#readyHandler) {
          window.removeEventListener("message", this.#readyHandler);
          this.#readyHandler = null;
        }

        if (this.#bridge) {
          this.#bridge.destroy();
          this.#bridge = null;
        }

        this.#rpc = null;

        if (this.#iframe) {
          this.#iframe.remove();
          this.#iframe = null;
        }
      }
    }
  );
}
