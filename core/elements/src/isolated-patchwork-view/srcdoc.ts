/** Generate the srcdoc HTML for the isolated iframe. */
export default function getSrcdocHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; }
  patchwork-view { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>
<patchwork-view id="root"></patchwork-view>
<script type="module">
  var log = function() {
    var args = ['[isolated-iframe]'].concat(Array.from(arguments));
    console.log.apply(console, args);
  };

  // 1. Signal ready to parent
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'isolated-patchwork-ready' }, '*');
  }
  log('ready, waiting for init...');

  // 2. Wait for init message (receives 3 ports: repo, rpc, fetch proxy)
  var init = await new Promise(function(resolve) {
    window.addEventListener('message', function handler(event) {
      if (!event.data || event.data.type !== 'isolated-patchwork-init') return;
      window.removeEventListener('message', handler);
      resolve({
        repoPort: event.ports[0],
        rpcPort: event.ports[1],
        fetchPort: event.ports[2],
        data: event.data,
      });
    });
  });
  var d = init.data;
  log('received init', { docUrl: d.docUrl, toolId: d.toolId });

  // 3. Set up fetch proxy for automerge URLs.
  // The sandboxed iframe can't fetch automerge URLs directly (bypasses host SW).
  // Proxy automerge URL fetches through the host via a dedicated MessagePort.
  var fetchPort = init.fetchPort;
  var nextFetchId = 0;
  var pendingFetches = {};

  fetchPort.onmessage = function(event) {
    var msg = event.data;
    var pending = pendingFetches[msg.id];
    if (pending) {
      delete pendingFetches[msg.id];
      pending.resolve(new Response(msg.body, {
        status: msg.status,
        headers: msg.headers,
      }));
    }
  };
  fetchPort.start();

  function proxyFetch(url) {
    return new Promise(function(resolve) {
      var id = nextFetchId++;
      pendingFetches[id] = { resolve: resolve };
      fetchPort.postMessage({ id: id, url: url });
    });
  }

  // Patch window.fetch for non-importShim callers (e.g., WASM loads, package.json)
  var originalFetch = window.fetch.bind(window);
  window.fetch = function(input, fetchInit) {
    var url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
    if (url.includes('/automerge%3A') || url.includes('/automerge:')) {
      return proxyFetch(url);
    }
    return originalFetch(input, fetchInit);
  };
  log('fetch proxy configured');

  // 4. Stub localStorage — sandboxed iframes throw SecurityError on access.
  try { localStorage; } catch { Object.defineProperty(window, 'localStorage', { value: { getItem: function() { return null; }, setItem: function() {}, removeItem: function() {} } }); }

  // 5. Load es-module-shims in shim mode.
  // Use esmsInitOptions.fetch so es-module-shims preserves the original URL
  // for relative import resolution (patching window.fetch doesn't work because
  // constructed Response objects have an empty .url property).
  self.esmsInitOptions = {
    shimMode: true,
    fetch: function(url, opts) {
      if (url.includes('/automerge%3A') || url.includes('/automerge:')) {
        return proxyFetch(url);
      }
      return originalFetch(url, opts);
    },
  };
  await import('https://ga.jspm.io/npm:es-module-shims@1.6.2/dist/es-module-shims.wasm.js');
  self.importShim.addImportMap(d.importMap);
  log('importmap configured');

  // 6. Import core modules
  var mods = await Promise.all([
    self.importShim('@automerge/automerge/slim'),
    self.importShim('@automerge/automerge-repo/slim'),
    self.importShim('@automerge/automerge-repo-network-messagechannel'),
    self.importShim('@automerge/automerge-subduction/slim'),
    self.importShim('@inkandswitch/patchwork-elements'),
    self.importShim('@inkandswitch/patchwork-plugins'),
    self.importShim('capnweb'),
  ]);
  var automerge = mods[0], amRepo = mods[1], network = mods[2],
      subduction = mods[3], elements = mods[4], plugins = mods[5],
      capnweb = mods[6];
  log('modules loaded');

  // 7. Initialize WASM (subduction first)
  var wasmResults = await Promise.all([
    fetch(d.hostOrigin + '/automerge.wasm').then(function(r) { return r.arrayBuffer(); }),
    fetch(d.hostOrigin + '/subduction.wasm').then(function(r) { return r.arrayBuffer(); }),
  ]);
  subduction.initSync(new Uint8Array(wasmResults[1]));
  await automerge.initializeWasm(new Uint8Array(wasmResults[0]));
  log('wasm initialized');

  // 8. Create ephemeral Repo (no storage — srcdoc has no IndexedDB)
  var repo = new amRepo.Repo({
    peerId: 'isolated-' + d.toolId + '-' + crypto.randomUUID().slice(0, 8),
    async sharePolicy() { return true; },
  });
  repo.networkSubsystem.addNetworkAdapter(
    new network.MessageChannelNetworkAdapter(init.repoPort)
  );
  log('repo connected');

  // 9. Register patchwork-view element
  elements.registerPatchworkViewElement({ repo: repo });

  // 10. Import and register the tool module
  // toolEntryUrl is the rewritten JS source (not a URL) — create a blob URL
  // in this origin so it's accessible from the sandbox.
  if (d.toolEntryUrl) {
    var toolBlobUrl = URL.createObjectURL(new Blob([d.toolEntryUrl], { type: 'application/javascript' }));
    var mod = await self.importShim(toolBlobUrl);
    if (Array.isArray(mod.plugins)) {
      log('registering ' + mod.plugins.length + ' plugin(s)');
      plugins.registerPlugins(mod.plugins, toolBlobUrl);
    }
  }
  log('tool loaded');

  // 11. Render
  var rootElement = document.getElementById('root');
  rootElement.setAttribute('doc-url', d.docUrl);
  rootElement.setAttribute('tool-id', d.toolId);

  // 12. RPC
  var iframeApi = Object.assign(Object.create(capnweb.RpcTarget.prototype), {
    navigate: function(docUrl, toolId) {
      log('navigate', { docUrl: docUrl, toolId: toolId });
      rootElement.setAttribute('doc-url', docUrl);
      rootElement.setAttribute('tool-id', toolId);
    },
  });
  var hostStub = capnweb.newMessagePortRpcSession(init.rpcPort, iframeApi);

  // 13. Forward events to host
  rootElement.addEventListener('patchwork:open-document', function(event) {
    var detail = event.detail;
    hostStub.openDocument(detail.url, detail.toolId, detail.title, detail.type);
  });
  rootElement.addEventListener('patchwork:mounted', function(event) {
    var detail = event.detail;
    hostStub.mounted(detail.url, detail.toolId);
  });

  log('boot complete');
<\/script>
</body>
</html>`;
}
