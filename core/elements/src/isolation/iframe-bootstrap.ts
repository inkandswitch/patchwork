/**
 * Generates the `srcdoc` HTML string for the isolated iframe.
 *
 * The bootstrap logic is written as a typed async function (`boot`) so that
 * tsc can check it. At runtime, `boot.toString()` is embedded into the
 * srcdoc's <script> tag as an IIFE.
 */

// RegistryEntry is a host↔iframe wire type — see ./types.ts (the single source
// of truth). Imported for use in this file's type positions and re-exported for
// any importer that sources it here.
import type { RegistryEntry } from "./types.js";
export type { RegistryEntry };

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
    rootComponentId: string;
    props: Record<string, unknown>;
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

  // Routes every message arriving on the RPC port to its handler, keyed by
  // `msg.type`. Responses to our outgoing requests (fetch-package/-resource)
  // are matched back to their pending promise by `msg.id`; the rest are
  // host-initiated pushes (live plugin registrations, provider-bridge events).
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
  //
  // This listener (like the RPC and patchwork:subscribe listeners) is never
  // removed: it is bound to the iframe's own document and lives for the
  // iframe's whole lifetime. The host tears the iframe down wholesale, so
  // there is nothing to clean up.
  document.addEventListener(
    "patchwork:open-document",
    ((event: CustomEvent) => {
      rpcPort.postMessage({ type: "open-document", detail: event.detail });
    }) as EventListener,
    true
  );

  const d = init.data;
  log("init", { root: d.rootComponentId });

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
        const source = result.source.replace(
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

    // 9b. Intercept host-origin <link> insertions SYNCHRONOUSLY, at insertion
    // time. Native <link> elements make direct browser requests that bypass
    // the fetch proxy and CORS-fail from the opaque origin. Crucially, the
    // browser begins that native request the instant the element is inserted —
    // BEFORE any async MutationObserver callback can run — so we cannot fix it
    // after the fact by removing/replacing the node. We must intervene before
    // the node enters the DOM, by patching the DOM insertion methods. Two
    // cases, both triggered by tool/bundler code (e.g. Vite's __vitePreload,
    // or the theming tool's ensureThemeLink):
    //
    //  - rel="modulepreload": flip to "modulepreload-shim". The browser
    //    ignores the unknown rel (no native fetch), while es-module-shims
    //    honors it and preloads the chunk through its source hook → our RPC.
    //    (The chunk also loads via the rewritten importShim dynamic import;
    //    this just makes the parallel preload work instead of CORS-failing.)
    //
    //  - rel="stylesheet": substitute a <style> element inserted in the link's
    //    place, and fill it by fetching the CSS through the proxy. The link
    //    itself never enters the DOM, so no native request is made. We map the
    //    original link → its <style> so a later link.remove()/removeChild()
    //    (e.g. theme deregistration) also removes the substituted <style>.
    const styleForLink = new WeakMap<HTMLLinkElement, HTMLStyleElement>();

    // Returns a replacement node to insert instead of `node`, or `node` itself
    // (possibly mutated) when no substitution is needed.
    const interceptInsertedNode = (node: Node): Node => {
      if (
        !(node instanceof HTMLLinkElement) ||
        !node.href ||
        !node.href.startsWith(hostOrigin)
      ) {
        return node;
      }

      if (node.rel === "modulepreload") {
        log("converted modulepreload → modulepreload-shim:", node.href);
        node.rel = "modulepreload-shim";
        return node;
      }

      if (node.rel === "stylesheet") {
        const href = node.href;
        const style = document.createElement("style");
        // Carry over data-* attributes (some tools key off them).
        for (const attr of Array.from(node.attributes)) {
          if (attr.name.startsWith("data-")) {
            style.setAttribute(attr.name, attr.value);
          }
        }
        styleForLink.set(node, style);
        fetch(href)
          .then((r) => r.text())
          .then((css) => {
            style.textContent = css;
          })
          .catch((err) => log("failed to load stylesheet:", href, err));
        log("substituted stylesheet link → style:", href);
        return style;
      }

      return node;
    };

    // Removal: when a substituted stylesheet <link> is removed, also remove
    // the <style> we inserted in its place. The link itself was never inserted
    // (we swapped in the <style>), so for a mapped link we just remove the
    // style and skip the native call (which would throw NotFoundError). For
    // every other node we defer to native behavior unchanged.
    const removeSubstituteStyle = (node: Node): boolean => {
      if (node instanceof HTMLLinkElement) {
        const style = styleForLink.get(node);
        if (style) {
          style.remove();
          styleForLink.delete(node);
          return true;
        }
      }
      return false;
    };

    // Install the prototype patches once. boot() runs a single time per iframe,
    // and the iframe (with these globals) is destroyed wholesale when the host
    // element is torn down — so there is nothing to restore. The guard is pure
    // defense in depth: it guarantees the wrappers can never stack even if
    // boot() were somehow re-entered.
    const PATCH_FLAG = "__patchworkDomPatched";
    if (!(Node.prototype as any)[PATCH_FLAG]) {
      (Node.prototype as any)[PATCH_FLAG] = true;

      const patchInsertion = (method: "appendChild" | "insertBefore") => {
        const original = (Node.prototype as any)[method] as (
          ...args: any[]
        ) => Node;
        (Node.prototype as any)[method] = function (
          this: Node,
          ...args: any[]
        ): Node {
          args[0] = interceptInsertedNode(args[0]);
          return original.apply(this, args);
        };
      };
      patchInsertion("appendChild");
      patchInsertion("insertBefore");

      const originalRemoveChild = Node.prototype.removeChild;
      (Node.prototype as any).removeChild = function (
        this: Node,
        child: Node
      ): Node {
        if (removeSubstituteStyle(child)) return child;
        return originalRemoveChild.call(this, child);
      };
      const originalRemove = Element.prototype.remove;
      (Element.prototype as any).remove = function (this: Element): void {
        if (removeSubstituteStyle(this)) return;
        originalRemove.call(this);
      };
    }

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

    // Live plugin registrations (plugin-registered RPC pushes) can arrive
    // before boot finishes registering the initial set. handleRpcMessage queues
    // those early arrivals by pushing them onto `pendingPluginUpdates`. Now that
    // the registry is ready, drain the queue...
    for (const entry of pendingPluginUpdates) {
      log("registering deferred plugin update:", entry.id);
      registerEntry(entry);
    }
    pendingPluginUpdates.length = 0;

    // ...then replace the array's `push` so any *future* arrival registers
    // immediately instead of queuing. This keeps handleRpcMessage's call site
    // unchanged (it always just `.push()`es) while flipping queue → live.
    pendingPluginUpdates.push = function (entry: any) {
      log("registering live plugin update:", entry.id);
      registerEntry(entry);
      return 0;
    };

    // 13. Mount the isolated root component.
    // The root is an ordinary patchwork:component named by the boot spec; the
    // normal <patchwork-view component=...> path resolves and mounts it from the
    // iframe's own registry (incl. the not-yet-loaded and hot-reload cases). Its
    // props travel as an inert <script type="application/json"> child the root
    // reads on mount — data, never executable, so nothing tool-bearing is ever
    // constructed from host-supplied code. The script is appended before the
    // <patchwork-view> connects, and patchwork-view defers its render by a
    // microtask, so the props are in place before the root's mount fn runs.
    const rootView = document.createElement("patchwork-view");
    rootView.setAttribute("component", d.rootComponentId);
    const propsScript = document.createElement("script");
    propsScript.type = "application/json";
    propsScript.textContent = JSON.stringify(d.props ?? {});
    rootView.appendChild(propsScript);
    repoProvider.appendChild(rootView);

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

    log(`boot complete — root "${d.rootComponentId}"`);
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

/**
 * The host's current resolved appearance, used to paint the iframe's first
 * frame to match. Both values are resolved browser values (not theming-tool
 * variables/attributes), so this stays independent of any specific theme tool.
 */
export interface IframeAppearance {
  /** Resolved background color to paint before the theme CSS loads. */
  background?: string;
  /** Resolved `color-scheme` (so form controls/scrollbars match immediately). */
  colorScheme?: string;
}

/**
 * Allow only characters that are safe to interpolate into the static srcdoc
 * CSS below. These values come from the host's own computed styles (a resolved
 * `rgb(...)`/`color()` string and a `color-scheme` keyword), not from tools,
 * but we sanitize anyway so nothing can break out of the <style> context.
 */
function cssSafe(value: string): string {
  return value.replace(/[^a-zA-Z0-9 #%(),.\-/]/g, "");
}

/**
 * Build the iframe srcdoc. The host's current background and color-scheme are
 * baked into the static markup so the iframe's *first paint* already matches
 * the host — eliminating the flash of white that otherwise shows until the
 * theming tool boots inside the iframe and applies the real theme CSS. This is
 * tool-agnostic: it mirrors whatever the host actually renders, with no
 * knowledge of how (or which tool) produced it.
 */
export function generateIframeSrcdoc(appearance?: IframeAppearance): string {
  const background = appearance?.background ? cssSafe(appearance.background) : "";
  const colorScheme = appearance?.colorScheme
    ? cssSafe(appearance.colorScheme)
    : "";
  const firstPaint =
    background || colorScheme
      ? `\n      ${colorScheme ? `color-scheme: ${colorScheme};` : ""}${
          background ? ` background: ${background};` : ""
        }`
      : "";

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
      flex-direction: row;${firstPaint}
    }
    /* Base layout for the platform elements, mirroring the host app shell's
       global.css. Without these, patchwork-view / repo-provider default to
       display:inline inside the iframe and any root that relies on a full-size
       flex/height context (e.g. a frame's document column) collapses. The host
       provides this for free via its site stylesheet; the isolated realm must
       provide it itself since that stylesheet does not cross the boundary. */
    repo-provider {
      flex: 1;
      min-width: 0;
      display: flex;
      width: 100%;
      height: 100%;
    }
    patchwork-view {
      display: block;
      width: 100%;
      height: 100%;
      contain: layout;
    }
  </style>
</head>
<body>
  <script>(${boot.toString()})();</script>
</body>
</html>`;
}
