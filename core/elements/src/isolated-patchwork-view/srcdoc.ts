/**
 * Srcdoc HTML for the isolated iframe.
 *
 * The bootstrap logic is written as a typed async function (`boot`) so that
 * tsc can check it. At runtime, `boot.toString()` is embedded into the
 * srcdoc's <script> tag as an IIFE.
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
  modulePort: MessagePort;
  data: {
    docUrl: string;
    toolId: string;
    toolEntryUrl?: string;
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

  // 2. Wait for init message (receives 2 ports: repo, module RPC)
  const init: InitMessage = await new Promise((resolve) => {
    window.addEventListener("message", function handler(event: MessageEvent) {
      if (!event.data || event.data.type !== "isolated-patchwork-init") return;
      window.removeEventListener("message", handler);
      resolve({
        repoPort: event.ports[0],
        modulePort: event.ports[1],
        data: event.data,
      });
    });
  });
  const d = init.data;
  log("received init", { docUrl: d.docUrl, toolId: d.toolId });

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

  // 4. Set up module RPC over the dedicated MessagePort.
  //    The source hook will use this to request module source from the host.
  let rpcId = 0;
  const pending = new Map<
    number,
    { resolve: (v: any) => void; reject: (e: Error) => void }
  >();

  init.modulePort.onmessage = (event: MessageEvent) => {
    const { id, ok, value, error } = event.data;
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    if (ok) {
      p.resolve(value);
    } else {
      p.reject(new Error(error));
    }
  };
  init.modulePort.start();

  function moduleRpc(msg: Record<string, unknown>): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++rpcId;
      pending.set(id, { resolve, reject });
      init.modulePort.postMessage({ id, ...msg });
    });
  }
  log("module RPC ready");

  // 5. Override fetch — the sandboxed iframe cannot make network requests,
  //    so we proxy all fetch calls through the host via RPC. This is needed
  //    because some modules (e.g., non-slim @automerge/automerge via
  //    vite-plugin-wasm) call fetch() at evaluation time to load WASM binaries.
  //    The host does the real fetch and returns both the content-type and body.
  (self as any).fetch = async (
    input: RequestInfo | URL,
    _init?: RequestInit
  ): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    log("fetch proxy:", url);
    const { contentType, body } = await moduleRpc({ type: "fetch", url });
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": contentType },
    });
  };

  // 6. Load es-module-shims in shim mode with custom source hook.
  //    The source hook intercepts all module fetches and routes them through
  //    the MessagePort RPC to the host, which can fetch using its service
  //    worker (for Automerge URLs) or normal fetch (for host-origin URLs).
  (self as any).esmsInitOptions = {
    shimMode: true,
    async source(
      url: string,
      _fetchOpts: any,
      _parent: string,
      _defaultSource: Function
    ) {
      log("source hook:", url);
      let source = await moduleRpc({ type: "load-module-source", url });
      // Workaround: es-module-shims' lexer misidentifies class methods named
      // `import` as dynamic import() expressions, causing parse errors.
      // A method definition is always preceded by newline + whitespace
      // (e.g., `  import(binary, args) {`), while a real dynamic import is
      // preceded by operators/delimiters (e.g., `= import(`, `(import(`).
      // Rewriting `import(` → `["import"](` in method-definition position
      // is semantically identical JS but avoids the lexer false-positive.
      source = source.replace(
        /^(\s+)import\s*\(/gm,
        '$1["import"]('
      );
      return { source, type: "js" };
    },
  };

  // Inject es-module-shims from the source text transferred by the host
  // (the sandboxed iframe cannot fetch it from a CDN).
  const esmsScript = document.createElement("script");
  esmsScript.textContent = d.esmsSource;
  document.head.appendChild(esmsScript);

  // es-module-shims may need a microtask to finish initialization
  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  const importShim: ImportShim = (self as any).importShim;
  if (!importShim) {
    throw new Error("es-module-shims failed to initialize");
  }
  importShim.addImportMap(d.importMap);
  log("importmap configured");

  // 7. Import core modules via RPC-backed source hook
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

  // 8. Initialize WASM from transferred ArrayBuffers (subduction first)
  subduction.initSync(new Uint8Array(d.subductionWasm));
  await automerge.initializeWasm(new Uint8Array(d.automergeWasm));
  log("wasm initialized");

  // 9. Create ephemeral Repo (no storage — srcdoc has no IndexedDB)
  const repo = new amRepo.Repo({
    peerId: "isolated-" + d.toolId + "-" + crypto.randomUUID().slice(0, 8),
    async sharePolicy() {
      return true;
    },
  });
  repo.networkSubsystem.addNetworkAdapter(
    new network.MessageChannelNetworkAdapter(init.repoPort)
  );
  log("repo connected");

  // 10. Register patchwork-view element
  elements.registerPatchworkViewElement({ repo });

  // 11. Import and register the tool module.
  if (d.toolEntryUrl) {
    const mod = await importShim(d.toolEntryUrl);
    if (Array.isArray(mod.plugins)) {
      log("registering " + mod.plugins.length + " plugin(s)");
      plugins.registerPlugins(mod.plugins, d.toolEntryUrl);
    }
  }
  log("tool loaded");

  // 12. Render
  const rootElement = document.getElementById("root")!;
  rootElement.setAttribute("doc-url", d.docUrl);
  rootElement.setAttribute("tool-id", d.toolId);

  // 13. Forward events to host via postMessage
  rootElement.addEventListener("patchwork:open-document", ((
    event: CustomEvent
  ) => {
    const detail = event.detail;
    window.parent.postMessage(
      {
        type: "patchwork:open-document",
        url: detail.url,
        toolId: detail.toolId,
        title: detail.title,
        docType: detail.type,
      },
      "*"
    );
  }) as EventListener);

  rootElement.addEventListener("patchwork:mounted", ((
    event: CustomEvent
  ) => {
    const detail = event.detail;
    window.parent.postMessage(
      {
        type: "patchwork:mounted",
        url: detail.url,
        toolId: detail.toolId,
      },
      "*"
    );
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
  // Embed boot() as a self-invoking async function in a module script.
  // boot.toString() includes the function signature, so we wrap it as an IIFE.
  const bootSource = boot
    .toString()
    .replace(/<\/script>/g, "<\\/script>");

  // CSP security model: the iframe can load resources from the host origin,
  // blob: URIs, data: URIs, and inline sources — but nothing else. This
  // prevents exfiltration to external servers. The host is the trust
  // boundary and can enforce per-tool capability policies at the server
  // level (deciding which resources to serve for each tool).
  //
  // Key directives:
  //   - default-src allows the host origin, blob:, data:, and inline/eval
  //     (needed by es-module-shims for module graph execution and WASM).
  //   - form-action 'none' — prevent form submissions (not covered by
  //     default-src).
  //   - frame-src falls back to default-src, so nested iframes can only
  //     load from the host origin (same restriction as everything else).
  const csp = [
    `default-src ${hostOrigin} blob: data: 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'`,
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
