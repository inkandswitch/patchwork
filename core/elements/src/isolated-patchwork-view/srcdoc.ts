/**
 * Srcdoc HTML for the isolated iframe.
 *
 * The bootstrap logic is written as a typed async function (`boot`) so that
 * tsc can check it. At runtime, `boot.toString()` is embedded into the
 * srcdoc's <script> tag as an IIFE.
 *
 * Bootstrap sequence:
 *   1. Signal ready, receive init message with 3 ports (repo, bootstrap, rpc)
 *   2. Set up manual postMessage RPC on bootstrap port (temporary)
 *   3. Load es-module-shims + importmap using the bootstrap channel
 *   4. importShim("capnweb") to get capnweb through the same channel
 *   5. Establish capnweb RPC session on rpc port — close bootstrap channel
 *   6. Rewire fetch proxy and source hook to use capnweb RPC
 *   7. Get PluginRegistryCapability and resolve tool for the document
 *   8. Register patchwork-view with tool resolution callbacks
 */

// ---------------------------------------------------------------------------
// Type declarations for runtime globals available inside the iframe.
// These are NOT imports — they describe APIs loaded dynamically at runtime.
// ---------------------------------------------------------------------------

/** Subset of the es-module-shims API used in the bootstrap. */
interface ImportShim {
  (specifier: string): Promise<any>;
  addImportMap(map: { imports?: Record<string, string>; scopes?: any }): void;
}

/** Init message sent from the host to the iframe. */
interface InitMessage {
  repoPort: MessagePort;
  bootstrapPort: MessagePort;
  rpcPort: MessagePort;
  data: {
    docUrl: string;
    toolId?: string;
    importMap: { imports?: Record<string, string>; scopes?: any };
    hostOrigin: string;
    hostStyles: string;
    esmsSource: string;
    automergeWasm: ArrayBuffer;
    subductionWasm: ArrayBuffer;
  };
}

// ---------------------------------------------------------------------------
// Bootstrap function — runs inside the iframe via boot.toString() + IIFE.
//
// CONSTRAINTS (violating these will silently break at runtime):
//  - No closures over module-scope variables or imports. Everything the
//    function needs must come from the init message or runtime globals.
//  - No TypeScript syntax that doesn't survive tsc emit (e.g., enums,
//    namespaces). Plain types/interfaces are fine (erased at compile time).
//  - The build must not minify or bundle this file in a way that transforms
//    the function body. The current build is tsc-only (target: esnext),
//    which preserves toString() output.
// ---------------------------------------------------------------------------

async function boot() {
  // Minimal debug-compatible logger. The real `debug` package isn't available
  // until modules load (step 9), but we need logging during bootstrap.
  // Respects the same localStorage("debug") namespace convention as the rest
  // of patchwork-next/core so logs can be filtered consistently.
  const NAMESPACE = "patchwork:elements:isolated-view";
  let debugEnabled = false;
  const log = (...args: unknown[]) => {
    if (!debugEnabled) return;
    console.debug(`%c${NAMESPACE}`, "color: #7c3aed", ...args);
  };

  // 1. Signal ready to parent
  if (window.parent !== window) {
    window.parent.postMessage({ type: "isolated-patchwork-ready" }, "*");
  }

  // 2. Wait for init message (receives 3 ports: repo, bootstrap, rpc)
  const init: InitMessage = await new Promise((resolve) => {
    window.addEventListener("message", function handler(event: MessageEvent) {
      if (!event.data || event.data.type !== "isolated-patchwork-init") return;
      window.removeEventListener("message", handler);
      resolve({
        repoPort: event.ports[0],
        bootstrapPort: event.ports[1],
        rpcPort: event.ports[2],
        data: event.data,
      });
    });
  });
  const d = init.data;

  // 3. Stub localStorage — sandboxed iframes throw SecurityError on access.
  try {
    void localStorage;
  } catch {
    Object.defineProperty(window, "localStorage", {
      value: {
        // Return "patchwork:*,iframe:patchwork*" for the "debug" key so the
        // debug package enables logging inside the iframe (which has no real
        // localStorage). Covers both patchwork:* and iframe:patchwork* namespaces.
        getItem: (key: string) => key === "debug" ? "patchwork:*,iframe:patchwork*" : null,
        setItem: () => {},
        removeItem: () => {},
      },
    });
  }

  // Now that localStorage is available (real or stubbed), evaluate debug flag.
  {
    const pattern = localStorage.getItem("debug") || "";
    if (pattern) {
      const re = new RegExp(
        "^" + pattern.split(",").map(p => p.trim().replace(/\*/g, ".*?")).join("$|^") + "$"
      );
      debugEnabled = re.test(NAMESPACE);
    }
  }
  log("init", { docUrl: d.docUrl });

  // 3b. Inject host page stylesheets (Tailwind/DaisyUI, etc.) so tools
  //     that rely on the host's CSS framework render correctly.
  if (d.hostStyles) {
    const style = document.createElement("style");
    style.textContent = d.hostStyles;
    document.head.appendChild(style);
  }

  // 4. Set up temporary postMessage RPC on the bootstrap port.
  //    Used only during bootstrap to load es-module-shims source and capnweb.
  //    Closed once capnweb RPC takes over.
  let bootstrapRpcId = 0;
  const bootstrapPending = new Map<
    number,
    { resolve: (v: any) => void; reject: (e: Error) => void }
  >();

  init.bootstrapPort.onmessage = (event: MessageEvent) => {
    const { id, ok, value, error } = event.data;
    const p = bootstrapPending.get(id);
    if (!p) return;
    bootstrapPending.delete(id);
    if (ok) p.resolve(value);
    else p.reject(new Error(error));
  };
  init.bootstrapPort.start();

  function bootstrapRpc(msg: Record<string, unknown>): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++bootstrapRpcId;
      bootstrapPending.set(id, { resolve, reject });
      init.bootstrapPort.postMessage({ id, ...msg });
    });
  }

  // 5. Load es-module-shims with source hook backed by bootstrap channel.
  //    This is temporary — the source hook will be rewired to capnweb RPC
  //    after capnweb is loaded.
  let loadModuleSource: (url: string) => Promise<string> = (url) =>
    bootstrapRpc({ type: "load-module-source", url });

  (self as any).esmsInitOptions = {
    shimMode: true,
    async source(
      url: string,
      _fetchOpts: any,
      _parent: string,
      _defaultSource: Function
    ) {
      log("source hook:", url);
      let source = await loadModuleSource(url);
      // Workaround: es-module-shims' lexer misidentifies class methods named
      // `import` as dynamic import() expressions, causing parse errors.
      // Only rewrite `import(` when followed by `) {` (a method definition),
      // not dynamic import() calls like `import("./module")`.
      source = source.replace(
        /^(\s+)import\s*\(([^)]*)\)\s*\{/gm,
        '$1["import"]($2) {'
      );
      return { source, type: "js" };
    },
  };

  const esmsScript = document.createElement("script");
  esmsScript.textContent = d.esmsSource;
  document.head.appendChild(esmsScript);

  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  const importShim: ImportShim = (self as any).importShim;
  if (!importShim) {
    throw new Error("es-module-shims failed to initialize");
  }
  importShim.addImportMap(d.importMap);
  log("importmap configured");

  // 6. Load capnweb via es-module-shims (routed through bootstrap channel).
  const capnweb = await importShim("capnweb");
  log("capnweb loaded");

  // 7. Establish capnweb RPC session and close bootstrap channel.
  //    The IframeApi receives host→iframe calls (e.g., registry updates).
  //    Late-bound references are filled in after modules load (step 9).
  let _plugins: any = null;
  let _importShim: any = null;

  class IframeApi extends capnweb.RpcTarget {
    onPluginRegistered(meta: any) {
      if (!_plugins || !_importShim) return;
      log("registry update from host:", meta.id, meta.importUrl);
      _plugins.getRegistry(meta.type).register({
        ...meta,
        load: async () => {
          const mod = await _importShim(meta.importUrl);
          if (Array.isArray(mod.plugins)) {
            const match = mod.plugins.find(
              (p: any) => p.id === meta.id && p.type === meta.type
            );
            if (match && typeof match.load === "function") {
              return match.load();
            }
          }
          return mod.default ?? mod;
        },
      }, meta.importUrl);
    }
  }

  const hostStub = capnweb.newMessagePortRpcSession(
    init.rpcPort,
    new IframeApi()
  );

  // Rewire the source hook to use capnweb RPC
  loadModuleSource = (url: string) => hostStub.loadModuleSource(url);

  // Close the bootstrap channel — no longer needed
  init.bootstrapPort.close();
  log("capnweb RPC ready, bootstrap channel closed");

  // 8. Override fetch via capnweb RPC.
  //    Only GET and HEAD are allowed. Request bodies are rejected to prevent
  //    tool code from using fetchResource as a general-purpose host-side
  //    request primitive.
  (self as any).fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const method = (init?.method || "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      throw new TypeError(
        `fetch proxy: only GET and HEAD are allowed, got ${method}`
      );
    }
    if (init?.body != null) {
      throw new TypeError("fetch proxy: request bodies are not allowed");
    }
    const url = typeof input === "string" ? input : input.toString();
    log("fetch proxy:", url);
    const result = await hostStub.fetchResource(url);
    return new Response(method === "HEAD" ? null : result.body, {
      status: 200,
      headers: { "Content-Type": result.contentType },
    });
  };

  // 9. Import core modules via RPC-backed source hook (now using capnweb)
  const [automerge, amRepo, network, subduction, elements, plugins] =
    await Promise.all([
      importShim("@automerge/automerge/slim"),
      importShim("@automerge/automerge-repo/slim"),
      importShim("@automerge/automerge-repo-network-messagechannel"),
      importShim("@automerge/automerge-subduction/slim"),
      importShim("@inkandswitch/patchwork-elements"),
      importShim("@inkandswitch/patchwork-plugins"),
    ]);
  log("modules loaded");

  // Fill in late-bound references for IframeApi (host→iframe push updates)
  _plugins = plugins;
  _importShim = importShim;

  // 10. Initialize WASM from transferred ArrayBuffers (subduction first)
  subduction.initSync(new Uint8Array(d.subductionWasm));
  await automerge.initializeWasm(new Uint8Array(d.automergeWasm));
  log("wasm initialized");

  // 11. Create ephemeral Repo (no storage — srcdoc has no IndexedDB)
  const repo = new amRepo.Repo({
    peerId: "isolated-" + crypto.randomUUID().slice(0, 8),
    async sharePolicy() {
      return true;
    },
  });
  repo.networkSubsystem.addNetworkAdapter(
    new network.MessageChannelNetworkAdapter(init.repoPort)
  );
  (window as any).repo = repo;
  log("repo connected");

  // 12. Pre-populate local plugin registries from the host.
  //     Fetch all plugin metadata (with opaque importUrls) for every registry
  //     type and register each as a LoadablePlugin in the local registry.
  //     This ensures sync APIs like getRegistry().filter().loadAll(),
  //     getFallbackTool(doc), getSupportedToolsForType(type) all work
  //     unchanged. Module code is only loaded on demand when load() is called.
  const registryCap = hostStub.getPluginRegistry();
  const registryTypes = await registryCap.listRegistryTypes();
  const allMetasByType = await Promise.all(
    registryTypes.map((type: string) => registryCap.list(type))
  );
  for (const metas of allMetasByType) {
    for (const meta of metas) {
      plugins.getRegistry(meta.type).register({
        ...meta,
        load: async () => {
          const mod = await importShim(meta.importUrl);
          if (Array.isArray(mod.plugins)) {
            const match = mod.plugins.find(
              (p: any) => p.id === meta.id && p.type === meta.type
            );
            if (match && typeof match.load === "function") {
              return match.load();
            }
          }
          return mod.default ?? mod;
        },
      }, meta.importUrl);
    }
  }
  log("local registries pre-populated with", allMetasByType.flat().length, "plugins");

  // 13. Register patchwork-view element — no special callbacks needed.
  //     The pre-populated local registry handles tool resolution via the
  //     standard getFallbackTool(doc) → getRegistry().get() → load() path.
  elements.registerPatchworkViewElement({ repo, debugNamespace: "iframe:patchwork:elements:view" });

  // 14. Render — patchwork-view resolves the tool via the local registry.
  const rootElement = document.getElementById("root")!;
  rootElement.setAttribute("doc-url", d.docUrl);
  if (d.toolId) {
    rootElement.setAttribute("tool-id", d.toolId);
  }

  // 15. Expose plugin registry capability for tools inside the iframe.
  (window as any).__patchwork = { registry: registryCap };

  // 16. Forward events to host via capnweb RPC
  rootElement.addEventListener("patchwork:open-document", ((
    event: CustomEvent
  ) => {
    const detail = event.detail;
    hostStub.onOpenDocument(
      detail.url,
      detail.toolId,
      detail.title,
      detail.type
    );
  }) as EventListener);

  rootElement.addEventListener("patchwork:mounted", ((
    event: CustomEvent
  ) => {
    const detail = event.detail;
    hostStub.onMounted(detail.url, detail.toolId);
  }) as EventListener);

  log("boot complete");
}

// ---------------------------------------------------------------------------
// Srcdoc HTML generator
// ---------------------------------------------------------------------------

const SRCDOC_CSS = `
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
  patchwork-view { display: block; width: 100%; height: 100%; }
`;

/** Generate the srcdoc HTML for the isolated iframe. */
export default function getSrcdocHtml(hostOrigin: string): string {
  const bootSource = boot
    .toString()
    .replace(/<\/script>/g, "<\\/script>");

  // CSP: start from default-src 'none' and explicitly allow only what is
  // needed. This prevents script-initiated network access (connect-src,
  // worker-src) and blocks nested iframes (frame-src) and plugins (object-src).
  // The actual network boundary is: sandbox + CSP + ResourcePolicy on host
  // RPC methods. CSP alone does not cover RPC-proxied fetches.

  // TODO: replace with per-tool resource whitelisting
  const allowedAssetOrigins = "https://cdn.tldraw.com";
  const assetSources = `${hostOrigin} ${allowedAssetOrigins}`;

  const csp = [
    "default-src 'none'",
    "script-src 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:",
    "connect-src blob:",
    `img-src ${assetSources} blob: data:`,
    `style-src ${hostOrigin} blob: 'unsafe-inline'`,
    `font-src ${assetSources} blob: data:`,
    `media-src ${assetSources} blob: data:`,
    "worker-src 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<style>${SRCDOC_CSS}</style>
</head>
<body>
<patchwork-view id="root"></patchwork-view>
<script type="module">
(${bootSource})();
</script>
</body>
</html>`;
}
