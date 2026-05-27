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
    esmsSource: string;
    automergeWasm: ArrayBuffer;
    subductionWasm: ArrayBuffer;
  };
}

// ---------------------------------------------------------------------------
// Bootstrap function — runs inside the iframe. Must be fully self-contained:
// no closures, no module imports. Everything it needs comes from the init
// message or from runtime globals.
// ---------------------------------------------------------------------------

async function boot() {
  const log = (...args: unknown[]) =>
    console.log("[isolated-iframe]", ...args);

  // 1. Signal ready to parent
  if (window.parent !== window) {
    window.parent.postMessage({ type: "isolated-patchwork-ready" }, "*");
  }
  log("ready, waiting for init...");

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
  log("received init", { docUrl: d.docUrl });

  // 3. Stub localStorage — sandboxed iframes throw SecurityError on access.
  try {
    void localStorage;
  } catch {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    });
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
      source = source.replace(/^(\s+)import\s*\(/gm, '$1["import"](');
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
  class IframeApi extends capnweb.RpcTarget {}

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
  log("repo connected");

  // 12. Get PluginRegistryCapability from host
  const registry = hostStub.getPluginRegistry();
  log("plugin registry capability obtained");

  // Helper: load a plugin module and register its plugins in the local registry.
  async function loadPluginModule(importUrl: string) {
    const mod = await importShim(importUrl);
    if (Array.isArray(mod.plugins)) {
      log("registering " + mod.plugins.length + " plugin(s) from", importUrl);
      plugins.registerPlugins(mod.plugins, importUrl);
    }
  }

  // 13. Register patchwork-view element with tool resolution callbacks.
  //     These callbacks are invoked by <patchwork-view> inside the iframe
  //     when it needs a tool that isn't in the local registry (e.g., when
  //     a container tool renders sub-documents).
  elements.registerPatchworkViewElement({
    repo,
    resolveToolForDocument: async (docUrl: string) => {
      const meta = await registry.resolveToolForDocument(docUrl);
      if (meta) {
        await loadPluginModule(meta.importUrl);
        return { toolId: meta.id };
      }
      return null;
    },
    resolveToolById: async (toolId: string) => {
      const meta = await registry.get(toolId);
      if (meta) await loadPluginModule(meta.importUrl);
    },
  });
  log("patchwork-view registered with tool resolution callbacks");

  // 14. Resolve and load the tool for the document via the capability.
  //     If a toolId hint was provided in the init message, use it directly.
  //     Otherwise, resolve the default tool for the document's datatype.
  let toolMeta: any = null;
  let toolId: string | undefined;
  if (d.toolId) {
    toolMeta = await registry.get(d.toolId);
    if (toolMeta) {
      await loadPluginModule(toolMeta.importUrl);
      toolId = toolMeta.id;
      log("tool resolved by id:", toolId);
    } else {
      log("tool id not found, falling back to document resolution");
    }
  }
  if (!toolMeta) {
    toolMeta = await registry.resolveToolForDocument(d.docUrl);
    if (toolMeta) {
      await loadPluginModule(toolMeta.importUrl);
      toolId = toolMeta.id;
      log("tool resolved for document:", toolId);
    } else {
      log("no tool found for document");
    }
  }

  // 15. Render
  const rootElement = document.getElementById("root")!;
  rootElement.setAttribute("doc-url", d.docUrl);
  if (toolId) {
    rootElement.setAttribute("tool-id", toolId);
  }

  // 16. Expose plugin registry capability for tools loaded inside the iframe.
  //     Tools like space/folder can use this to list datatypes, resolve tools
  //     for sub-documents, etc.
  (window as any).__patchwork = { registry };

  // 17. Forward events to host via capnweb RPC
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
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; }
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
  const csp = [
    "default-src 'none'",
    "script-src 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:",
    "connect-src blob:",
    `img-src ${hostOrigin} blob: data:`,
    `style-src ${hostOrigin} blob: 'unsafe-inline'`,
    `font-src ${hostOrigin} blob: data:`,
    `media-src ${hostOrigin} blob: data:`,
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
