/**
 * Generates the `srcdoc` HTML string for the isolated iframe.
 *
 * The bootstrap logic is written as a typed async function (`boot`) so that
 * tsc can check it. At runtime, `boot.toString()` is embedded into the
 * srcdoc's <script> tag as an IIFE.
 */

export interface RegistryEntry {
  type: string;
  id: string;
  name: string;
  importUrl?: string;
  [key: string]: unknown;
}

export interface SerializedView {
  tagName: string;
  attributes: Record<string, string>;
  children: SerializedView[];
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
    views: SerializedView[];
    registryEntries: RegistryEntry[];
    esmsSource: string;
    hostStyles: string;
    importMap: { imports?: Record<string, string>; scopes?: any };
    hostOrigin: string;
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
  // Minimal debug-compatible logger. The real `debug` package isn't available
  // until modules load, but we need logging during bootstrap.
  // Respects the same localStorage("debug") namespace convention.
  const NAMESPACE = "patchwork:elements:isolation:iframe";
  const peerId = "isolation-" + crypto.randomUUID().slice(0, 8);
  let debugEnabled = false;
  const log = (...args: unknown[]) => {
    if (!debugEnabled) return;
    console.debug(`%c${NAMESPACE}`, "color: #7c3aed", ...args);
  };

  // 1. Stub localStorage
  try {
    void localStorage;
  } catch {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: (key: string) => (key === "debug" ? "patchwork:*" : null),
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null,
      },
    });
  }

  // Evaluate debug flag now that localStorage is available.
  {
    const pattern = localStorage.getItem("debug") || "";
    if (pattern) {
      const re = new RegExp(
        "^" +
          pattern
            .split(",")
            .map((p: string) => p.trim().replace(/\*/g, ".*?"))
            .join("$|^") +
          "$"
      );
      debugEnabled = re.test(NAMESPACE);
    }
  }

  // Tag all debug-package output from inside the iframe
  const _originalConsoleDebug = console.debug;
  console.debug = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("%c")) {
      args[0] = `[${peerId}] ` + args[0];
    }
    _originalConsoleDebug.apply(console, args);
  };

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
  // Providers bridge: tracks subscriptions forwarded to the host
  const bridgedSubscriptions = new Map<number, MessagePort>();
  let fetchId = 0;
  let bridgeId = 0;
  const pendingPluginUpdates: any[] = [];

  function fetchModule(url: string): Promise<FetchModuleResult> {
    return new Promise((resolve, reject) => {
      const id = ++fetchId;
      pendingModuleFetches.set(id, { resolve, reject });
      rpcPort.postMessage({ type: "fetch-package", id, url });
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

    if (msg.type === "fetch-package-response") {
      const pending = pendingModuleFetches.get(msg.id);
      if (pending) {
        pendingModuleFetches.delete(msg.id);
        pending.resolve({ source: msg.source, resolvedUrl: msg.resolvedUrl });
      }
    } else if (msg.type === "fetch-package-error") {
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
    } else if (msg.type === "plugin-registered") {
      // Live registry update from host — register the plugin in the
      // iframe's registry so new tools/datatypes are available.
      pendingPluginUpdates.push(msg.entry);
    } else if (msg.type === "providers-bridge-change") {
      // Host provider pushed a value — relay to the consumer's port
      log("providers-bridge: received change for id:", msg.id, "value:", msg.value);
      const port = bridgedSubscriptions.get(msg.id);
      if (port) {
        port.postMessage({ type: "change", value: msg.value });
      }
    } else if (msg.type === "providers-bridge-rejected") {
      // Host rejected this subscription type — clean up
      log("providers-bridge: rejected by host for id:", msg.id);
      bridgedSubscriptions.delete(msg.id);
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

  // Navigation bridge: forward patchwork:open-document events to host.
  // We do NOT stopPropagation — the event still bubbles within the iframe
  // so that providers (e.g. SelectedDocProvider) inside the iframe can
  // observe it. The host's SelectedDocProvider deduplicates by URL, so
  // forwarding the same selection back is a no-op.
  document.addEventListener(
    "patchwork:open-document",
    ((event: CustomEvent) => {
      rpcPort.postMessage({ type: "open-document", detail: event.detail });
    }) as EventListener,
    true
  );

  const d = init.data;
  log("init", { views: d.views?.length ?? 0 });

  // Inject host page stylesheets so tools render with the same CSS
  // framework (Tailwind, DaisyUI, etc.) as on the host.
  if (d.hostStyles) {
    const style = document.createElement("style");
    style.textContent = d.hostStyles;
    document.head.appendChild(style);
  }

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
        log("source hook:", url);
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
    log("importmap configured");

    // 7. Import core runtime modules
    const [
      automerge,
      automergeSubduction,
      automergeRepo,
      messagechannel,
      patchworkElements,
      patchworkPlugins,
      patchworkProviders,
    ] = await Promise.all([
      importShim("@automerge/automerge/slim"),
      importShim("@automerge/automerge-subduction/slim"),
      importShim("@automerge/automerge-repo/slim"),
      importShim("@automerge/automerge-repo-network-messagechannel"),
      importShim("@inkandswitch/patchwork-elements"),
      importShim("@inkandswitch/patchwork-plugins"),
      importShim("@inkandswitch/patchwork-providers"),
    ]);

    log("modules loaded");

    // 8. Initialize WASM from transferred ArrayBuffers
    automergeSubduction.initSync(new Uint8Array(d.subductionWasm));
    await automerge.initializeWasm(new Uint8Array(d.automergeWasm));
    log("wasm initialized");

    // 9. Install fetch proxy — intercepts all host-origin fetches.
    // The sandboxed iframe can't reach the host's service worker, so
    // package resources (including CSS @imports) must go through RPC.
    // Installed after WASM init so initializeWasm/initSync aren't affected.
    const hostOrigin = d.hostOrigin;
    const originalFetch = self.fetch;
    (self as any).fetch = async (
      input: RequestInfo | URL,
      requestInit?: RequestInit
    ): Promise<Response> => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.startsWith(hostOrigin)) {
        const result = await fetchResource(url);
        return new Response(result.body, {
          status: 200,
          headers: { "Content-Type": result.contentType },
        });
      }
      return originalFetch(input, requestInit);
    };
    log("fetch proxy installed");

    // 9b. Intercept host-origin <link rel="stylesheet"> additions to <head>.
    // Native <link> elements make direct browser requests that bypass the
    // fetch proxy and CORS-fail from the opaque origin; replace them with a
    // <style> tag whose content is fetched through the proxy. (modulepreload
    // links are handled synchronously in 9c below — the observer is too late.)
    const linkObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (
            node instanceof HTMLLinkElement &&
            node.rel === "stylesheet" &&
            node.href &&
            node.href.startsWith(hostOrigin)
          ) {
            const href = node.href;
            node.remove();
            fetch(href)
              .then((r) => r.text())
              .then((css) => {
                const style = document.createElement("style");
                style.textContent = css;
                for (const attr of Array.from(node.attributes)) {
                  if (attr.name.startsWith("data-")) {
                    style.setAttribute(attr.name, attr.value);
                  }
                }
                document.head.appendChild(style);
              })
              .catch((err) =>
                log("failed to load stylesheet:", href, err)
              );
          }
        }
      }
    });
    linkObserver.observe(document.head, { childList: true });

    // 9c. Convert <link rel="modulepreload"> → "modulepreload-shim" at
    // INSERTION TIME (synchronously), not via the MutationObserver above.
    //
    // Code-split bundles (e.g. Vite's __vitePreload) inject a plain
    // <link rel="modulepreload" crossorigin> per chunk. The browser begins
    // the native preload fetch the instant the element is inserted — which
    // CORS-fails from the opaque origin — and that happens BEFORE any async
    // MutationObserver callback can run, so removing/replacing the node after
    // the fact cannot prevent the failed request. We must mutate the node
    // before it enters the DOM. es-module-shims only honors
    // "modulepreload-shim" links (which it preloads through its source hook →
    // our RPC proxy), so flipping rel here both silences the native fetch
    // (the browser ignores the unknown rel) and lets esms warm the chunk.
    //
    // The chunk also loads via the rewritten importShim dynamic import; this
    // just makes the parallel preload work instead of CORS-failing.
    const convertModulePreload = (node: Node): void => {
      if (
        node instanceof HTMLLinkElement &&
        node.rel === "modulepreload" &&
        node.href &&
        node.href.startsWith(hostOrigin)
      ) {
        log("converted modulepreload → modulepreload-shim:", node.href);
        node.rel = "modulepreload-shim";
      }
    };
    const patchInsertion = <K extends "appendChild" | "insertBefore">(
      proto: Node,
      method: K
    ) => {
      const original = proto[method] as (...args: any[]) => Node;
      (proto as any)[method] = function (this: Node, ...args: any[]): Node {
        convertModulePreload(args[0]);
        return original.apply(this, args);
      };
    };
    patchInsertion(Node.prototype, "appendChild");
    patchInsertion(Node.prototype, "insertBefore");

    // 10. Create in-memory Repo
    const syncAdapter = new messagechannel.MessageChannelNetworkAdapter(
      init.syncPort
    );
    const repo = new automergeRepo.Repo({
      peerId: peerId,
      network: [syncAdapter],
    });
    (window as any).repo = repo;
    log("repo connected");

    // 11. Register patchwork-view and repo-provider
    patchworkElements.registerPatchworkViewElement({ repo });
    patchworkProviders.registerRepoProviderElement(repo);

    // 11b. Create <repo-provider> as root wrapper — mirrors the host
    // bootloader pattern. It answers `repo:handle-descriptor` subscriptions
    // so OverlayRepo.find() doesn't hang.
    const repoProvider = document.createElement("repo-provider");
    document.body.appendChild(repoProvider);

    // 12. Register plugins with lazy loading via importShim
    // Plugin importUrls are pkg: URLs (converted by host before boot)
    function registerEntry(entry: RegistryEntry) {
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
      patchworkPlugins.registerPlugins([plugin], entry.importUrl || "");
    }

    if (d.registryEntries) {
      for (const entry of d.registryEntries) {
        registerEntry(entry);
      }
      log("plugins registered:", d.registryEntries.length);
    }

    // Process any plugin updates that arrived during boot
    for (const entry of pendingPluginUpdates) {
      log("registering deferred plugin update:", entry.id);
      registerEntry(entry);
    }
    pendingPluginUpdates.length = 0;

    // Switch to live registration for future updates
    pendingPluginUpdates.push = function (entry: any) {
      log("registering live plugin update:", entry.id);
      registerEntry(entry);
      return 0;
    };

    // 13. Reconstruct the serialized element tree from the host.
    // The host serializes its children (including provider wrappers,
    // layout divs, and tool views) as a recursive tree. We rebuild
    // the same DOM structure inside the iframe.
    function reconstructTree(
      specs: SerializedView[],
      parent: HTMLElement
    ) {
      for (const spec of specs) {
        const el = document.createElement(spec.tagName);
        for (const [key, value] of Object.entries(spec.attributes)) {
          el.setAttribute(key, value);
        }
        if (spec.children.length > 0) {
          reconstructTree(spec.children, el);
        }
        parent.appendChild(el);
      }
    }

    const views = d.views ?? [];
    reconstructTree(views, repoProvider);

    // 14. Providers bridge — forward unclaimed patchwork:subscribe events
    // to the host so host-side providers (e.g. AccountProvider for
    // patchwork:contact) can answer them. Local providers call
    // stopPropagation(), so only unclaimed subscriptions reach document.
    document.addEventListener("patchwork:subscribe", ((event: CustomEvent) => {
      const detail = event.detail;
      if (!detail?.selector?.type || !detail?.port) return;

      log("providers-bridge: captured unclaimed subscription:", detail.selector.type, detail.selector);

      event.stopPropagation();
      const id = ++bridgeId;
      const consumerPort = detail.port as MessagePort;
      bridgedSubscriptions.set(id, consumerPort);

      // Forward to host
      rpcPort.postMessage({
        type: "providers-bridge",
        id,
        selector: detail.selector,
      });

      // Listen for consumer unsubscribe
      consumerPort.addEventListener("message", (e: MessageEvent) => {
        if (e.data?.type === "unsubscribe") {
          log("providers-bridge: consumer unsubscribed:", detail.selector.type, id);
          rpcPort.postMessage({ type: "providers-bridge-unsubscribe", id });
          bridgedSubscriptions.delete(id);
          consumerPort.close();
        }
      });
      consumerPort.start();
    }) as EventListener);

    log(`boot complete — ${views.length} top-level views`);
    rpcPort.postMessage({ type: "boot-complete" });
  } catch (err: any) {
    console.error("[iframe] boot failed:", err);
    document.body.textContent = "Failed to load tool: " + (err.message || err);
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
      display: flex;
      flex-direction: row;
    }
  </style>
</head>
<body>
  <script>(${boot.toString()})();</script>
</body>
</html>`;
}
