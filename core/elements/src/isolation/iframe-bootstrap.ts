/**
 * Generates the `srcdoc` HTML string for the isolated iframe.
 *
 * The bootstrap logic is written as a typed async function (`boot`) so that
 * tsc can check it. At runtime, `boot.toString()` is embedded into the
 * srcdoc's <script> tag as an IIFE.
 */

// Provider and navigation bridge event listeners are set up inside boot()
// rather than as separate injected code, so they can reference the local
// rpcPort variable.

export interface RegistryEntry {
  type: string;
  id: string;
  name: string;
  importUrl?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Type declarations for runtime globals available inside the iframe.
// ---------------------------------------------------------------------------

interface ImportShim {
  (specifier: string): Promise<any>;
  addImportMap(map: { imports?: Record<string, string>; scopes?: any }): void;
}

interface InitMessage {
  rpcPort: MessagePort;
  syncPort: MessagePort;
  data: {
    docUrl: string;
    toolId: string | null;
    registryEntries: RegistryEntry[];
    esmsSource: string;
    importMap: { imports?: Record<string, string>; scopes?: any };
    automergeWasm: ArrayBuffer;
    subductionWasm: ArrayBuffer;
  };
}

interface FetchModuleResult {
  source: string;
  resolvedUrl: string;
}

interface FetchResourceResult {
  body: ArrayBuffer;
  contentType: string;
}

// ---------------------------------------------------------------------------
// Boot function — runs inside the iframe via boot.toString() + IIFE.
// ---------------------------------------------------------------------------

async function boot() {
  // 1. Stub localStorage
  try {
    void localStorage;
  } catch {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null,
      },
    });
  }

  // 2. RPC infrastructure
  let rpcPort: MessagePort;
  const pendingModuleFetches = new Map<
    number,
    { resolve: (r: FetchModuleResult) => void; reject: (e: Error) => void }
  >();
  const pendingResourceFetches = new Map<
    number,
    { resolve: (r: FetchResourceResult) => void; reject: (e: Error) => void }
  >();
  let fetchId = 0;

  function fetchModule(url: string): Promise<FetchModuleResult> {
    return new Promise((resolve, reject) => {
      const id = ++fetchId;
      pendingModuleFetches.set(id, { resolve, reject });
      rpcPort.postMessage({ type: "fetch-module", id, url });
    });
  }

  function fetchResource(url: string): Promise<FetchResourceResult> {
    return new Promise((resolve, reject) => {
      const id = ++fetchId;
      pendingResourceFetches.set(id, { resolve, reject });
      rpcPort.postMessage({ type: "fetch-resource", id, url });
    });
  }

  function handleRpcMessage(event: MessageEvent) {
    const msg = event.data;
    if (!msg) return;

    if (msg.type === "fetch-module-response") {
      const pending = pendingModuleFetches.get(msg.id);
      if (pending) {
        pendingModuleFetches.delete(msg.id);
        pending.resolve({ source: msg.source, resolvedUrl: msg.resolvedUrl });
      }
    } else if (msg.type === "fetch-module-error") {
      const pending = pendingModuleFetches.get(msg.id);
      if (pending) {
        pendingModuleFetches.delete(msg.id);
        pending.reject(new Error(msg.error));
      }
    } else if (msg.type === "fetch-resource-response") {
      const pending = pendingResourceFetches.get(msg.id);
      if (pending) {
        pendingResourceFetches.delete(msg.id);
        pending.resolve({ body: msg.body, contentType: msg.contentType });
      }
    } else if (msg.type === "fetch-resource-error") {
      const pending = pendingResourceFetches.get(msg.id);
      if (pending) {
        pendingResourceFetches.delete(msg.id);
        pending.reject(new Error(msg.error));
      }
    }
  }

  // 3. Wait for init message from host
  const init: InitMessage = await new Promise((resolve) => {
    window.addEventListener("message", function handler(event: MessageEvent) {
      if (!event.data || event.data.type !== "boot") return;
      window.removeEventListener("message", handler);
      resolve({
        rpcPort: event.ports[0],
        syncPort: event.ports[1],
        data: event.data,
      });
    });
  });

  rpcPort = init.rpcPort;
  rpcPort.addEventListener("message", handleRpcMessage);
  rpcPort.start();

  // Provider bridge: forward patchwork:subscribe events to host
  document.addEventListener(
    "patchwork:subscribe",
    ((event: CustomEvent) => {
      const { selector, port } = event.detail;
      event.stopPropagation();
      rpcPort.postMessage({ type: "provider-subscribe", selector }, [port]);
    }) as EventListener,
    true
  );

  // Navigation bridge: forward patchwork:open-document events to host
  document.addEventListener(
    "patchwork:open-document",
    ((event: CustomEvent) => {
      event.stopPropagation();
      rpcPort.postMessage({ type: "open-document", detail: event.detail });
    }) as EventListener,
    true
  );

  const d = init.data;

  try {
    // 4. Configure es-module-shims with source hook
    (self as any).esmsInitOptions = {
      shimMode: true,
      async source(
        url: string,
        _fetchOpts: any,
        _parent: string,
        _defaultSource: Function
      ) {
        const result = await fetchModule(url);
        let source = result.source.replace(
          /^(\s+)import\s*\(([^)]*)\)\s*\{/gm,
          '$1["import"]($2) {'
        );
        return { source, url: result.resolvedUrl, type: "js" };
      },
    };

    // 5. Inline es-module-shims source and wait for initialization
    const esmsScript = document.createElement("script");
    esmsScript.textContent = d.esmsSource;
    document.head.appendChild(esmsScript);

    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    const importShim: ImportShim = (self as any).importShim;
    if (!importShim) {
      throw new Error("es-module-shims failed to initialize");
    }

    // 6. Add the host's import map
    if (d.importMap) {
      importShim.addImportMap(d.importMap);
    }

    // 7. Import core runtime modules
    const [
      automerge,
      automergeSubduction,
      automergeRepo,
      messagechannel,
      patchworkElements,
      patchworkPlugins,
    ] = await Promise.all([
      importShim("@automerge/automerge/slim"),
      importShim("@automerge/automerge-subduction/slim"),
      importShim("@automerge/automerge-repo/slim"),
      importShim("@automerge/automerge-repo-network-messagechannel"),
      importShim("@inkandswitch/patchwork-elements"),
      importShim("@inkandswitch/patchwork-plugins"),
    ]);

    // 8. Initialize WASM from transferred ArrayBuffers
    automergeSubduction.initSync(new Uint8Array(d.subductionWasm));
    await automerge.initializeWasm(new Uint8Array(d.automergeWasm));

    // 9. Install selective fetch proxy — only pkg: URLs are proxied.
    // Installed after WASM init so initializeWasm/initSync aren't affected.
    const originalFetch = self.fetch;
    (self as any).fetch = async (
      input: RequestInfo | URL,
      requestInit?: RequestInit
    ): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("pkg:")) {
        const result = await fetchResource(url);
        return new Response(result.body, {
          status: 200,
          headers: { "Content-Type": result.contentType },
        });
      }
      return originalFetch(input, requestInit);
    };

    // 10. Create in-memory Repo
    const syncAdapter = new messagechannel.MessageChannelNetworkAdapter(
      init.syncPort
    );
    const repo = new automergeRepo.Repo({
      peerId: "iframe-" + crypto.randomUUID().slice(0, 8),
      network: [syncAdapter],
    });
    (window as any).repo = repo;

    // 11. Register patchwork-view
    patchworkElements.registerPatchworkViewElement();

    // 12. Register plugins with lazy loading via importShim
    // Plugin importUrls are pkg: URLs (converted by host before boot)
    if (d.registryEntries) {
      for (const entry of d.registryEntries) {
        const plugin = {
          ...entry,
          load: entry.importUrl
            ? async () => {
                const mod = await importShim(entry.importUrl!);
                if (Array.isArray(mod.plugins)) {
                  const match = mod.plugins.find(
                    (p: any) => p.id === entry.id && p.type === entry.type
                  );
                  if (match && typeof match.load === "function") {
                    return match.load();
                  }
                }
                return mod.default || mod;
              }
            : undefined,
        };
        patchworkPlugins.registerPlugins(
          [plugin],
          entry.importUrl || ""
        );
      }
    }

    // 13. Render the tool
    const view = document.createElement("patchwork-view");
    if (d.docUrl) view.setAttribute("doc-url", d.docUrl);
    if (d.toolId) view.setAttribute("tool-id", d.toolId);
    document.body.appendChild(view);

    rpcPort.postMessage({ type: "boot-complete" });
  } catch (err: any) {
    console.error("[iframe] boot failed:", err);
    document.body.textContent =
      "Failed to load tool: " + (err.message || err);
    rpcPort.postMessage({ type: "boot-error", error: String(err) });
  }
}

// ---------------------------------------------------------------------------
// Srcdoc generator
// ---------------------------------------------------------------------------

export function generateIframeSrcdoc(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    patchwork-view {
      display: block;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <script>(${boot.toString()})();</script>
</body>
</html>`;
}
