# Sandboxed iframe module loading — architecture and open problems

## What we proved

We can load and run existing JavaScript modules inside an opaque-origin sandboxed iframe (`sandbox="allow-scripts"`, no `allow-same-origin`) without relying on iframe-owned service worker URL interception. The module graph loads, WASM initializes, the tool mounts, and document sync works via MessagePort.

## Architecture

```
HOST PAGE                                SANDBOXED IFRAME (srcdoc, opaque origin)

  +- resolves importmap to               +- boot() IIFE runs inline
  |  absolute host-origin URLs            |
  |                                       +- injects host page CSS (Tailwind/
  +- collects host page stylesheets       |  DaisyUI) into iframe <head>
  |  (Tailwind/DaisyUI) as text           |
  |                                       +- sets up temporary postMessage RPC
  +- pre-fetches:                         |  on bootstrap port
  |  - es-module-shims source (text)      |
  |  - automerge.wasm (ArrayBuffer)       +- overrides self.fetch -> RPC proxy
  |  - subduction.wasm (ArrayBuffer)      |
  |                                       +- injects es-module-shims via
  +- creates 3 MessageChannels:           |  script.textContent (can't fetch CDN)
  |  - repoChannel (Automerge sync)       |
  |  - bootstrapChannel (temp module RPC) +- es-module-shims configured with
  |  - rpcChannel (capnweb RPC)           |  custom async source hook
  |                                       |  (backed by bootstrap channel initially)
  +- postMessage to iframe:               |
  |  init data + 3 ports +                +- importShim("capnweb") loads capnweb
  |  2 WASM ArrayBuffers (transferred)    |  through the bootstrap source hook
  |  + hostStyles + optional toolId       |
  |                                       +- capnweb RPC session established on
  +- bootstrap handler on port1:          |  rpc port; source hook rewired to use
  |  "load-module-source" requests only   |  hostStub.loadModuleSource()
  |  restricted to importmap URLs         |
  |                                       +- bootstrap port closed
  +- HostApi (capnweb RpcTarget) on       |
  |  rpcChannel.port1:                    +- gets PluginRegistryCapability:
  |  - getPluginRegistry() → capability   |  registry.getFallbackTool(docUrl)
  |  - loadModuleSource(url)              |  or registry.get(toolId) if hint given
  |  - fetchResource(url)                 |
  |  - onMounted(url, toolId)             +- loads tool module via importShim
  |  - onOpenDocument(url, ...)           |  (opaque URL → loadModuleSource →
  |                                       |   host resolves real URL → fetch →
  +- OpaqueUrlMapper replaces             |   rewriteAutomergeUrls → source text)
  |  automerge doc IDs with tokens        |
  |  in plugin URLs and source text       +- patchwork-view registered with
  |                                       |  getFallbackTool/resolveToolById
  +- ResourcePolicy gates all RPC         |  callbacks for sub-document resolution
     fetch/load methods                   |
                                          +- tool renders, events forwarded
                                             to host via capnweb RPC calls
```

### Key files

- `core/elements/src/isolated-patchwork-view/index.ts` — host-side custom element, HostApi, OpaqueUrlMapper, PluginRegistryTarget, bootstrap + RPC channels
- `core/elements/src/isolated-patchwork-view/srcdoc.ts` — iframe boot script + HTML generator
- `core/elements/src/isolated-patchwork-view/rpc-types.ts` — capnweb RPC contract types (HostRpcContract, PluginRegistryCapability, PluginMetadata, IframeRpcContract)
- `core/elements/src/isolated-patchwork-view/resource-policy.ts` — ResourcePolicy interface + default policy

## Bootstrap sequence

The sandboxed iframe cannot fetch anything on its own. A three-port strategy solves the chicken-and-egg problem of loading capnweb (which is needed for RPC) inside the iframe:

1. **Bootstrap port** — temporary postMessage-based RPC, restricted to importmap URLs only. Used to load es-module-shims source hook and then `importShim("capnweb")`.
2. **RPC port** — capnweb `newMessagePortRpcSession`. Once capnweb is loaded via the bootstrap channel, an RPC session is established here. The source hook and fetch proxy are rewired to use it. The bootstrap port is then closed.
3. **Repo port** — direct `MessageChannelNetworkAdapter` for Automerge document sync. Unchanged from the original design.

## Host page CSS injection

The iframe has no access to the host page's stylesheets. Tools like the folder viewer use Tailwind/DaisyUI utility classes (`card`, `badge`, `flex`, `p-4`, etc.) that are compiled into the host page's CSS. Without these styles, tools render unstyled.

At init time, the host collects all stylesheets from the page (both inline `<style>` tags and `<link rel="stylesheet">` hrefs) as text, and sends the concatenated CSS in the init message as `hostStyles`. The iframe boot injects this as a `<style>` tag in `<head>` before any tools render.

Tool-specific CSS (e.g., tldraw's `main.css`) is loaded separately by each tool's `load()` function via `fetch()`, which goes through the iframe's fetch proxy.

## How module resolution works

The es-module-shims `resolve` hook is **synchronous** (not awaited in the es-module-shims source code), so we cannot do async RPC there. Instead:

1. **Importmap handles bare specifiers synchronously.** The host resolves the page's importmap entries to absolute host-origin URLs (e.g., `@automerge/automerge/slim` -> `http://localhost:5173/packages/@automerge/automerge/slim.js`) and sends the resolved importmap to the iframe. es-module-shims uses it internally during its synchronous resolution step.

2. **Relative imports resolve via standard URL resolution.** `./helper.js` relative to `http://localhost:5173/__plugin__/p0/dist/index.js` produces `http://localhost:5173/__plugin__/p0/dist/helper.js`. This is synchronous and works fine. The opaque `__plugin__` prefix is preserved through relative resolution.

3. **The `source` hook does the heavy lifting.** It's async (awaited in es-module-shims' source code). It receives the already-resolved URL and calls `hostStub.loadModuleSource(url)` via capnweb RPC. The host resolves opaque URLs via `OpaqueUrlMapper.toReal()`, fetches the real source, rewrites automerge URL strings via `rewriteAutomergeUrls()`, and returns the source text.

## Plugin registry capability

The iframe discovers and loads tools/datatypes via a `PluginRegistryCapability` — a capnweb object-capability granted by the host through `hostStub.getPluginRegistry()`. The capability mirrors the original sync APIs from `@inkandswitch/patchwork-plugins` but is async (RPC-backed) and returns opaque `importUrl` values.

### Capability methods

- `list(pluginType)` — mirrors `getRegistry(type).all()`. Lists all plugins of a given type.
- `get(pluginId)` — mirrors `getRegistry(type).get(id)`. Gets a single plugin by ID.
- `getSupportedToolsForType(type)` — mirrors `getSupportedToolsForType(type)` from tools.ts.
- `getFallbackTool(docUrl)` — mirrors `getFallbackTool(doc)`. Takes `docUrl` since doc objects can't cross RPC; the host reads the doc to determine its type.
- `getSupportedTools(docUrl)` — mirrors `getSupportedTools(doc)`. Same `docUrl` approach.

All methods return `PluginMetadata` objects — the same shape as plugin descriptions from the host registry, but with `importUrl` replaced by opaque URLs. The iframe also exposes wrapper functions on `window.__patchwork` with the original `doc`-based signatures (`getFallbackTool(doc)`, `getSupportedTools(doc)`, `getSupportedToolsForType(type)`) that extract the doc URL and call the capability.

### Tool resolution flow

1. At boot, the iframe gets the capability: `hostStub.getPluginRegistry()`
2. If a `toolId` hint was provided in the init message, calls `registry.get(toolId)` to resolve by ID
3. Otherwise, calls `registry.getFallbackTool(docUrl)` to get the default tool for the document
4. Loads the tool module via `importShim(meta.importUrl)` — the opaque URL goes through `loadModuleSource`
5. Registers the tool's plugins in the local registry via `registerPlugins(mod.plugins, ...)`
6. For sub-documents (e.g., folder viewer rendering nested docs), `patchwork-view` has `getFallbackTool` and `resolveToolById` callbacks that follow the same flow

## Opaque URL scheme

Tool/plugin source code lives in automerge documents. The host serves these files at URLs like `http://host/%automerge%3Axyz.../dist/index.js`, where the path contains an encoded automerge document ID. If the iframe learned these URLs, it could use the repo sync channel to access and modify tool source code.

To prevent this, the `OpaqueUrlMapper` replaces automerge document ID segments with opaque tokens:

```
Real:   http://host/%automerge%3Axyz.../dist/index.js
Opaque: http://host/__plugin__/p0/dist/index.js
```

**How it works:**

1. `toOpaque(url)`: Parses the URL, splits path segments, URI-decodes each, and checks with `isValidAutomergeUrl()`. When an automerge URL segment is found, assigns a per-session token (`p0`, `p1`, ...) and replaces the segment in the URL.

2. `toReal(url)`: Scans for any registered `__plugin__/pN` segment and replaces it back with the original encoded automerge URL segment.

3. `rewriteAutomergeUrls(source)`: Replaces automerge URL strings in module source text before sending to the iframe. Plugin modules contain `importUrl: "automerge:xyz..."` literals — these are rewritten to opaque equivalents so real automerge URLs never enter the iframe.

4. Relative imports within the tool (e.g., `./utils.js`) resolve against the opaque base URL, producing more opaque URLs like `http://host/__plugin__/p0/dist/utils.js` — the same `loadModuleSource` → `toReal` → fetch path handles them.

5. Bare specifiers (e.g., `@automerge/automerge-repo`) resolve via the import map to normal `https://` URLs — unchanged, no opaque mapping needed.

**Security rule:** Automerge URLs flow iframe → host only (e.g., document URLs in `getFallbackTool(docUrl)`). They never flow host → iframe — `importUrl` fields always contain opaque URLs, and source text is rewritten.

## Communication model: capnweb RPC

Host-iframe communication uses [capnweb](https://github.com/cloudflare/capnweb), a JavaScript-native RPC library with object-capability semantics. This replaces the earlier hand-rolled postMessage request/response protocol.

### RPC contracts

**HostRpcContract** (host exposes to iframe):
- `getPluginRegistry()` → `PluginRegistryCapability` — grants a capability for querying the plugin registry
- `loadModuleSource(url)` — fetch module source text for es-module-shims (resolves opaque `__plugin__/` URLs, rewrites automerge URL strings in source)
- `fetchResource(url)` — fetch any resource (returns content-type + body, resolves opaque URLs)
- `onMounted(url, toolId)` — iframe reports successful tool mount
- `onOpenDocument(url, toolId?, title?, docType?)` — iframe requests navigation

**PluginRegistryCapability** (returned by `getPluginRegistry()`):
- `list(pluginType)` — list all plugins of a given type
- `get(pluginId)` — get a single plugin by ID
- `getSupportedToolsForType(type)` — get all tools that support a datatype
- `getFallbackTool(docUrl)` — get the default tool for a document
- `getSupportedTools(docUrl)` — get all tools that support a document's datatype

**IframeRpcContract** (iframe exposes to host):
- Currently empty — placeholder for future host→iframe calls (navigate, focus, theme)

### Why capnweb

- **Type-safe**: method signatures checked at compile time via `RpcStub<T>`
- **Bidirectional**: both sides can call methods on each other
- **Extensible**: adding a new capability is adding a method, not a message type + handler
- **OCAP foundation**: objects passed by reference become capabilities — the host can pass scoped capability objects to the iframe

## Resource policy

All `loadModuleSource` and `fetchResource` calls on the capnweb RPC channel are gated by a `ResourcePolicy` interface:

```typescript
interface ResourcePolicy {
  canFetch(url: string): boolean;
}
```

The host creates a policy via an optional `createPolicy(hostOrigin, importMapUrls)` factory passed to `registerIsolatedPatchworkViewElement`. Opaque `__plugin__/` URLs bypass the policy check (they are resolved by the `OpaqueUrlMapper` and are always allowed). Non-opaque URLs are checked against the policy before fetching.

The bootstrap channel is separately hardened: it only serves URLs that appear in the resolved importmap.

## Security model: CSP and the host as gatekeeper

### Two-layer isolation

The sandboxed iframe is isolated by two complementary mechanisms:

1. **Sandbox (browser-enforced):** `sandbox="allow-scripts"` with no `allow-same-origin` gives the iframe an opaque origin. It cannot access the host page's DOM, cookies, localStorage, IndexedDB, or service workers. This is the DOM/storage isolation boundary.

2. **CSP (browser-enforced):** A Content-Security-Policy meta tag restricts what origins the iframe can load resources from. This is the network isolation boundary — it prevents exfiltration to external servers.

### CSP policy

The CSP starts from `default-src 'none'` and explicitly allows only what is needed:

```
default-src 'none';
script-src 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:;
connect-src blob:;
img-src <host-origin> blob: data:;
style-src <host-origin> blob: 'unsafe-inline';
font-src <host-origin> blob: data:;
media-src <host-origin> blob: data:;
worker-src 'none';
frame-src 'none';
object-src 'none';
base-uri 'none';
form-action 'none'
```

Key directives:

- **`default-src 'none'`** — deny everything not explicitly allowed.
- **`connect-src blob:`** — blocks `fetch()`, `XMLHttpRequest`, `WebSocket`, etc. to all origins. Only `blob:` URLs are permitted (es-module-shims creates these internally). Module loading and resource fetching use capnweb RPC over MessagePort, which is not subject to `connect-src`. **Note:** this causes harmless `.js.map` source map errors in DevTools — the browser tries to fetch source maps but CSP blocks them. These don't affect functionality.
- **`script-src`** — allows inline scripts (boot IIFE), eval (es-module-shims), WASM compilation, and blob URLs.
- **`img-src`, `style-src`, `font-src`, `media-src`** — allow the host origin for browser-initiated subresource loads. `style-src` also allows `'unsafe-inline'` for the injected host CSS.
- **`frame-src 'none'`** — blocks nested iframes.
- **`base-uri 'none'`** — blocks `<base href="...">`.
- **`worker-src 'none'`** — blocks web workers and service workers.
- **`object-src 'none'`** — blocks plugins.

### The network boundary

The network boundary is the combination of three mechanisms:

1. **Sandbox (browser-enforced):** opaque origin prevents DOM/storage/service-worker access.
2. **CSP (browser-enforced):** blocks direct network access from script APIs (`connect-src blob:`) and restricts browser-initiated subresource loads to the host origin.
3. **ResourcePolicy on host RPC methods (application-enforced):** gates what the host will actually fetch on behalf of the iframe when it receives `loadModuleSource` or `fetchResource` calls via capnweb RPC.

### Access control layers

1. **Bootstrap channel** — restricted to importmap URLs only. Short-lived, closed after capnweb loads.
2. **capnweb RPC channel** — gated by `ResourcePolicy`. Opaque `__plugin__/` URLs are always allowed (resolved by OpaqueUrlMapper). Other URLs are checked against the policy.
3. **Fetch proxy constraints** — the iframe's `self.fetch` override only allows GET and HEAD methods with no request body.
4. **CSP** — browser-enforced. Blocks direct script-initiated network access and restricts browser-initiated subresource loads to the host origin.

### Resource loading: two categories

1. **JavaScript-initiated loading** — `import()`, `fetch()`, etc. `import()` goes through es-module-shims source hook → capnweb RPC. `fetch()` goes through the global override → capnweb RPC, restricted to GET/HEAD. Direct fetch calls bypassing the override are blocked by `connect-src blob:`. The host has full control, gated by ResourcePolicy.

2. **Browser-engine-initiated loading** — CSS `url()`, `<img src>`, `@font-face`, etc. These bypass JavaScript interception. CSP allows them for the host origin only. The host serves them without per-tool policy enforcement. Tools that need specific assets must ensure they are available from the host origin (see "Tool compatibility" below).

## Tool compatibility requirements

Tools running inside the isolated iframe may need changes to work correctly. The common issues and their solutions:

### CSS framework dependency

**Problem:** Tools that use Tailwind/DaisyUI utility classes (e.g., `card`, `badge`, `flex`, `p-4`) render unstyled because the iframe doesn't have the host page's CSS.

**Solution:** The host page's compiled CSS is automatically collected and injected into the iframe at boot time via the `hostStyles` field in the init message. No tool changes needed — this is handled by the infrastructure.

### External CDN assets (tldraw)

**Problem:** tldraw loads fonts, icons, and translations from `cdn.tldraw.com`. The iframe blocks these requests (CSP `connect-src blob:` and ResourcePolicy).

**Solution:** Self-host the assets from the patchwork-next host site:

1. Install `@tldraw/assets` (matching the tldraw version) in the tool package
2. Import `getAssetUrls` from `@tldraw/assets/selfHosted` and pass to `<Tldraw assetUrls={assetUrls}>`
3. Copy the asset files (`fonts/`, `icons/`, `translations/`, `embed-icons/`) from `@tldraw/assets` to the host site's public folder (`patchwork-next/sites/tiny-patchwork/public/`)

The self-hosted URLs resolve to `/fonts/...`, `/icons/...`, etc. from the host origin. CSS `@font-face` rules load fonts directly from the host (allowed by CSP `font-src <host-origin>`). Translation `fetch()` calls go through the fetch proxy → host fetches from the public folder.

**Affected tools:** `patchwork-base/tldraw4`, `patchwork-tools/space` (both use tldraw)

### Tool-specific CSS files

**Problem:** Tools that load their own CSS via `fetch()` and inject it (e.g., tldraw4's `main.css`) work correctly — the fetch proxy handles this. But CSS loaded via `<link>` tags would need the file to be at the host origin.

**Solution:** No changes needed for tools that load CSS via `fetch()` + inject as `<style>`. This is the recommended pattern for tool-specific CSS in the iframe.

### Source maps

**Problem:** The browser's DevTools tries to fetch `.js.map` source maps for modules loaded inside the iframe. CSP `connect-src blob:` blocks these requests, producing console errors.

**Solution:** These are harmless — they only affect DevTools source mapping, not functionality. They disappear when DevTools is closed. No fix needed.

## Open problems

### Document-level sync filtering

The iframe's ephemeral Repo currently uses `sharePolicy: () => true`, meaning it can sync any document the host repo knows about. Restricting this to a per-tool allowed set is desirable but the implementation approach needs further discussion.

### Registry API alignment

The `PluginRegistryCapability` methods are async (RPC-backed) while the original `@inkandswitch/patchwork-plugins` APIs are synchronous. Tools that call `getSupportedToolsForType()`, `getFallbackTool()`, etc. inside the iframe need to use the async versions from `window.__patchwork` or the capability stub. A future improvement could pre-populate the iframe's local registry so the sync APIs work directly.

### Fonts and CORS

CSS `@font-face` with cross-origin URLs requires `Access-Control-Allow-Origin` headers. Since the iframe has an opaque origin, fonts must be served from the host origin (same-origin with the host page). Self-hosting fonts in the host's public folder (as done for tldraw) avoids CORS issues. Adding `Access-Control-Allow-Origin: *` to the service worker's responses would also work but would allow the iframe to bypass ResourcePolicy for browser-initiated loads.

### es-module-shims quirks

The `script-src` directive includes `'unsafe-eval'`, `'unsafe-inline'`, and `blob:` specifically for es-module-shims. These are implementation details of es-module-shims' shim mode, not fundamental to the architecture.
