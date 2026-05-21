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
 */

import { type AutomergeUrl, type Repo } from "@automerge/automerge-repo";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";
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
 * Resolve a tool's automerge folder URL to rewritten JS source.
 *
 * The host fetches the tool's entry point JS through its service worker,
 * rewrites all relative imports to absolute automerge URLs, and returns
 * the source string. The iframe will create its own blob URL from it.
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
      #repoChannel: MessageChannel | null = null;
      #initEpoch = 0;
      #readyHandler: ((e: MessageEvent) => void) | null = null;
      #messageHandler: ((e: MessageEvent) => void) | null = null;

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

        // Resolve tool entry point URL on the host side
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

        // Connect iframe repo directly to host repo via MessageChannel
        const repoChannel = new MessageChannel();
        repo.networkSubsystem.addNetworkAdapter(
          new MessageChannelNetworkAdapter(repoChannel.port1, {
            useWeakRef: true,
          })
        );
        this.#repoChannel = repoChannel;

        // Listen for messages from the iframe (event forwarding)
        this.#messageHandler = (e: MessageEvent) => {
          if (e.source !== iframe.contentWindow) return;
          const msg = e.data;
          if (msg?.type === "patchwork:mounted") {
            this.dispatchEvent(
              new MountedEvent({
                url: msg.url as AutomergeUrl,
                toolId: msg.toolId,
              })
            );
          } else if (msg?.type === "patchwork:open-document") {
            this.dispatchEvent(
              new OpenDocumentEvent({
                url: msg.url as AutomergeUrl,
                toolId: msg.toolId,
                title: msg.title,
                type: msg.docType,
              })
            );
          }
        };
        window.addEventListener("message", this.#messageHandler);

        // Pre-fetch WASM binaries to transfer to the iframe
        const [automergeWasm, subductionWasm] = await Promise.all([
          fetch("/automerge.wasm").then((r) => r.arrayBuffer()),
          fetch("/subduction.wasm").then((r) => r.arrayBuffer()),
        ]);

        if (epoch !== this.#initEpoch) return;

        // Resolve importmap to absolute host-origin URLs
        const importMapEl = document.querySelector('script[type="importmap"]');
        const rawImportMap = importMapEl
          ? JSON.parse(importMapEl.textContent || "{}")
          : { imports: {} };
        const importMap = resolveImportMap(rawImportMap, document.baseURI);

        // Send init message with transferred port and WASM binaries
        iframe.contentWindow!.postMessage(
          {
            type: "isolated-patchwork-init",
            docUrl,
            toolId,
            toolEntryUrl,
            importMap,
            automergeWasm,
            subductionWasm,
          },
          "*",
          [repoChannel.port2, automergeWasm, subductionWasm]
        );
      }

      #teardown() {
        this.#initEpoch++;

        if (this.#readyHandler) {
          window.removeEventListener("message", this.#readyHandler);
          this.#readyHandler = null;
        }

        if (this.#messageHandler) {
          window.removeEventListener("message", this.#messageHandler);
          this.#messageHandler = null;
        }

        if (this.#repoChannel) {
          this.#repoChannel.port1.close();
          this.#repoChannel.port2.close();
          this.#repoChannel = null;
        }

        if (this.#iframe) {
          this.#iframe.remove();
          this.#iframe = null;
        }
      }
    }
  );
}
