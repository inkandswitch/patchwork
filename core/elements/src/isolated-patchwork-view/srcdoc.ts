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
  data: {
    docUrl: string;
    toolId: string;
    toolEntryUrl?: string;
    importMap: { imports?: Record<string, string>; scopes?: any };
    hostOrigin: string;
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

  // 2. Wait for init message (receives 1 port: repo)
  const init: InitMessage = await new Promise((resolve) => {
    window.addEventListener("message", function handler(event: MessageEvent) {
      if (!event.data || event.data.type !== "isolated-patchwork-init") return;
      window.removeEventListener("message", handler);
      resolve({
        repoPort: event.ports[0],
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

  // 4. Load es-module-shims in shim mode.
  (self as any).esmsInitOptions = { shimMode: true };
  const esmsUrl =
    "https://ga.jspm.io/npm:es-module-shims@1.6.2/dist/es-module-shims.wasm.js";
  await import(/* @vite-ignore */ esmsUrl);
  const importShim: ImportShim = (self as any).importShim;
  importShim.addImportMap(d.importMap);
  log("importmap configured");

  // 5. Import core modules
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

  // 6. Initialize WASM (subduction first)
  const [automergeWasm, subductionWasm] = await Promise.all([
    fetch(d.hostOrigin + "/automerge.wasm").then((r: Response) =>
      r.arrayBuffer()
    ),
    fetch(d.hostOrigin + "/subduction.wasm").then((r: Response) =>
      r.arrayBuffer()
    ),
  ]);
  subduction.initSync(new Uint8Array(subductionWasm));
  await automerge.initializeWasm(new Uint8Array(automergeWasm));
  log("wasm initialized");

  // 7. Create ephemeral Repo (no storage — srcdoc has no IndexedDB)
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

  // 8. Register patchwork-view element
  elements.registerPatchworkViewElement({ repo });

  // 9. Import and register the tool module.
  if (d.toolEntryUrl) {
    const mod = await importShim(d.toolEntryUrl);
    if (Array.isArray(mod.plugins)) {
      log("registering " + mod.plugins.length + " plugin(s)");
      plugins.registerPlugins(mod.plugins, d.toolEntryUrl);
    }
  }
  log("tool loaded");

  // 10. Render
  const rootElement = document.getElementById("root")!;
  rootElement.setAttribute("doc-url", d.docUrl);
  rootElement.setAttribute("tool-id", d.toolId);

  // 11. Forward events to host via postMessage
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
export default function getSrcdocHtml(): string {
  // Embed boot() as a self-invoking async function in a module script.
  // boot.toString() includes the function signature, so we wrap it as an IIFE.
  const bootSource = boot
    .toString()
    .replace(/<\/script>/g, "<\\/script>");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
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
