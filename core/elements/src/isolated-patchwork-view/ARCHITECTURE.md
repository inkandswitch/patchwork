# Sandboxed iframe module loading — architecture and open problems

## What we proved

We can load and run existing JavaScript modules inside an opaque-origin sandboxed iframe (`sandbox="allow-scripts"`, no `allow-same-origin`) without relying on iframe-owned service worker URL interception. The module graph loads, WASM initializes, the tool mounts, and document sync works via MessagePort. Existing sync plugin APIs (`getRegistry().filter().loadAll()`, `getFallbackTool()`, `getSupportedToolsForType()`) work unchanged inside the iframe via pre-populated local registries.

## Architecture

```
HOST PAGE                                SANDBOXED IFRAME (srcdoc, opaque origin)

  +- resolves importmap to               +- boot() IIFE runs inline
  |  absolute host-origin URLs            |
  |                                       +- stubs localStorage (enables debug
  +- collects host page stylesheets       |  logging via patchwork:* namespace)
  |  (Tailwind/DaisyUI) as text           |
  |                                       +- injects host page CSS into <head>
  +- pre-fetches:                         |
  |  - es-module-shims source (text)      +- sets up temporary postMessage RPC
  |  - automerge.wasm (ArrayBuffer)       |  on bootstrap port
  |  - subduction.wasm (ArrayBuffer)      |
  |                                       +- overrides self.fetch → RPC proxy
  +- creates 3 MessageChannels:           |
  |  - repoChannel (Automerge sync)       +- injects es-module-shims via
  |  - bootstrapChannel (temp module RPC) |  script.textContent (can't fetch CDN)
  |  - rpcChannel (capnweb RPC)           |
  |                                       +- capnweb RPC session established
  +- postMessage to iframe:               |  source hook rewired to use
  |  init data + 3 ports +                |  hostStub.loadModuleSource()
  |  2 WASM ArrayBuffers (transferred)    |
  |  + hostStyles + optional toolId       +- pre-populates ALL local plugin
  |                                       |  registries from host via capability:
  +- HostApi (capnweb RpcTarget):         |  listRegistryTypes() → list(type)
  |  - getPluginRegistry() → capability   |  each entry is a LoadablePlugin with
  |  - loadModuleSource(url)              |  load() → importShim(opaqueUrl)
  |  - fetchResource(url)                 |
  |  - onMounted(url, toolId)             +- sync APIs now work locally:
  |  - onOpenDocument(url, ...)           |  getFallbackTool(), getRegistry().get()
  |                                       |  filter(), loadAll(), etc.
  +- OpaqueUrlMapper:                     |
  |  - toOpaque: automerge segment → pN   +- registerPatchworkViewElement({ repo })
  |  - toReal: pN → automerge segment     |  no special callbacks needed
  |  - rewriteAutomergeUrls in source     |
  |                                       +- patchwork-view resolves tool via
  +- Pushes registry updates to iframe    |  local pre-populated registry,
  |  via iframeStub.onPluginRegistered()  |  triggers load() → importShim → RPC
  |  when ModuleWatcher re-registers      |
  |                                       +- tool renders, events forwarded
  +- ResourcePolicy gates RPC methods        to host via capnweb RPC calls
```

### Key files

- `core/elements/src/isolated-patchwork-view/index.ts` — host-side custom element, HostApi, OpaqueUrlMapper, PluginRegistryTarget, registry push subscriptions, bootstrap + RPC channels
- `core/elements/src/isolated-patchwork-view/srcdoc.ts` — iframe boot script + HTML generator, registry pre-population, IframeApi (receives push updates)
- `core/elements/src/isolated-patchwork-view/rpc-types.ts` — capnweb RPC contract types (HostRpcContract, PluginRegistryCapability, PluginMetadata, IframeRpcContract)
- `core/elements/src/isolated-patchwork-view/resource-policy.ts` — ResourcePolicy interface + default policy

## Bootstrap sequence

The sandboxed iframe cannot fetch anything on its own. A three-port strategy solves the chicken-and-egg problem of loading capnweb (which is needed for RPC) inside the iframe:

1. **Bootstrap port** — temporary postMessage-based RPC, restricted to importmap URLs only. Used to load es-module-shims source hook and then `importShim("capnweb")`.
2. **RPC port** — capnweb `newMessagePortRpcSession`. Once capnweb is loaded via the bootstrap channel, an RPC session is established here. The source hook and fetch proxy are rewired to use it. The bootstrap port is then closed.
3. **Repo port** — direct `MessageChannelNetworkAdapter` for Automerge document sync.

## Host page CSS injection

The iframe has no access to the host page's stylesheets. Tools like the folder viewer use Tailwind/DaisyUI utility classes (`card`, `badge`, `flex`, `p-4`, etc.) that are compiled into the host page's CSS. Without these styles, tools render unstyled.

At init time, the host collects all stylesheets from the page (both inline `<style>` tags and `<link rel="stylesheet">` hrefs) as text, and sends the concatenated CSS in the init message as `hostStyles`. The iframe boot injects this as a `<style>` tag in `<head>` before any tools render.

The iframe's own `SRCDOC_CSS` is minimal — just `html, body` sizing. It does not include a universal `*` reset, which would conflict with Tailwind's preflight.

## Registry pre-population

At boot, the iframe pre-populates its local plugin registries from the host so that existing sync APIs work unchanged:

1. Calls `registryCap.listRegistryTypes()` to discover all registry types (e.g., `patchwork:tool`, `patchwork:datatype`, `codemirror:extension`)
2. Calls `registryCap.list(type)` for each type to get all plugin metadata (with opaque `importUrl` values)
3. Registers each as a `LoadablePlugin` in the local registry with a `load()` function that:
   - Queries `registryCap.get(meta.id)` for the current `importUrl` (may have been updated by ModuleWatcher)
   - Calls `importShim(importUrl)` → es-module-shims source hook → `loadModuleSource` RPC → host serves source
   - Finds the matching plugin in `mod.plugins` by both `id` AND `type`, calls its `load()`
   - Returns the implementation

After pre-population, sync APIs like `getRegistry("codemirror:extension").filter(...).loadAll(...)`, `getFallbackTool(doc)`, `getSupportedToolsForType(type)` all work against local data. Module code is only loaded on demand when `load()` or `loadAll()` is called.

### Registry push updates

The host's ModuleWatcher may re-register plugins with new `importUrl` values after the iframe boots. To keep the iframe's registry in sync:

1. After RPC setup, the host subscribes to `"registered"` events on all host registries
2. When a plugin is re-registered, the host converts it to `PluginMetadata` (with opaque URL) and calls `iframeStub.onPluginRegistered(meta)`
3. The iframe's `IframeApi.onPluginRegistered()` re-registers the plugin in the local registry with the updated `importUrl`

This ensures the iframe always has current plugin metadata without polling.

### Lazy entry point resolution

Plugin metadata in the pre-populated registry uses folder-level opaque URLs (e.g., `__plugin__/p0/`) rather than full entry point URLs (e.g., `__plugin__/p0/dist/index.js`). This avoids fetching `package.json` for every plugin at boot time — some plugins may not be synced locally, and concurrent fetches could overload the service worker.

When `loadModuleSource` receives a folder-level URL (ending with `/`), it:
1. Resolves `toReal` to get the real automerge folder URL
2. Fetches `package.json` to find the entry point
3. Returns a re-export stub: `export * from "./dist/index.js";`

This ensures relative imports within the entry module resolve correctly against the `dist/` subdirectory, not the folder root.

## How module resolution works

The es-module-shims `resolve` hook is **synchronous** (not awaited in the es-module-shims source code), so we cannot do async RPC there. Instead:

1. **Importmap handles bare specifiers synchronously.** The host resolves the page's importmap entries to absolute host-origin URLs and sends the resolved importmap to the iframe.

2. **Relative imports resolve via standard URL resolution.** `./helper.js` relative to `http://localhost:5173/__plugin__/p0/dist/index.js` produces `http://localhost:5173/__plugin__/p0/dist/helper.js`. The opaque `__plugin__` prefix is preserved.

3. **The `source` hook does the heavy lifting.** It's async. It receives the already-resolved URL and calls `hostStub.loadModuleSource(url)` via capnweb RPC. The host resolves opaque URLs via `OpaqueUrlMapper.toReal()`, handles folder URLs via re-export stubs, fetches the real source, rewrites automerge URL strings, and returns the source text.

## Plugin registry capability

The `PluginRegistryCapability` is used primarily for pre-population at boot. Its methods:

- `listRegistryTypes()` — discover all registry types from the host
- `list(pluginType)` — list all plugins of a given type (with opaque `importUrl` values)
- `get(pluginId)` — get a single plugin by ID (used by `load()` to get the current `importUrl`)
- `getSupportedToolsForType(type)` — mirrors `getSupportedToolsForType(type)` from tools.ts
- `getFallbackTool(docUrl)` — mirrors `getFallbackTool(doc)`, takes docUrl since doc objects can't cross RPC
- `getSupportedTools(docUrl)` — mirrors `getSupportedTools(doc)`

## Opaque URL scheme

Tool/plugin source code lives in automerge documents. The `OpaqueUrlMapper` replaces automerge document ID segments in URLs with opaque tokens to hide tool source code locations from the iframe:

```
Real:   http://host/%automerge%3Axyz.../dist/index.js
Opaque: http://host/__plugin__/p0/dist/index.js
```

**`toOpaque(url)`**: Parses the URL, splits path segments, URI-decodes each, checks with `isValidAutomergeUrl()`. Assigns a per-session token and replaces the segment.

**`toReal(url)`**: Scans for `__plugin__/pN/` (with trailing slash to prevent prefix matching — `p1/` must not match `p10/`) and replaces back.

**`rewriteAutomergeUrls(source)`**: Replaces decoded automerge URL strings in module source text before sending to the iframe. Ensures `importUrl` literals in plugin definitions use opaque values.

**Security rule:** Automerge URLs flow iframe → host only. They never flow host → iframe.

## Communication model: capnweb RPC

Host-iframe communication uses [capnweb](https://github.com/cloudflare/capnweb), a JavaScript-native RPC library with object-capability semantics.

### RPC contracts

**HostRpcContract** (host exposes to iframe):
- `getPluginRegistry()` → `PluginRegistryCapability`
- `loadModuleSource(url)` — resolves opaque URLs, handles folder URLs via re-export stubs, rewrites automerge URL strings
- `fetchResource(url)` — resolves opaque URLs, returns content-type + body
- `onMounted(url, toolId)` — iframe reports successful tool mount
- `onOpenDocument(url, toolId?, title?, docType?)` — iframe requests navigation

**IframeRpcContract** (iframe exposes to host):
- `onPluginRegistered(meta: PluginMetadata)` — host pushes registry updates

### Why capnweb

- **Type-safe**: method signatures checked at compile time via `RpcStub<T>`
- **Bidirectional**: both sides can call methods on each other (host pushes registry updates)
- **Extensible**: adding a new capability is adding a method
- **OCAP foundation**: objects passed by reference become capabilities

## Resource policy

All `loadModuleSource` and `fetchResource` calls are gated by a `ResourcePolicy` interface. Opaque `__plugin__/` URLs bypass the policy (resolved by OpaqueUrlMapper). Non-opaque URLs are checked before fetching.

The bootstrap channel is separately hardened: it only serves URLs from the resolved importmap.

## Security model: CSP and the host as gatekeeper

### CSP policy

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

**`connect-src blob:`** causes harmless `.js.map` source map errors in DevTools. These don't affect functionality.

### Access control layers

1. **Bootstrap channel** — importmap URLs only, short-lived
2. **capnweb RPC** — gated by ResourcePolicy; opaque URLs always allowed
3. **Fetch proxy** — GET/HEAD only, no request body
4. **CSP** — browser-enforced network isolation

## Tool compatibility requirements

### CSS framework dependency

**Automatic.** Host page CSS (Tailwind/DaisyUI) is injected into the iframe at boot. No tool changes needed.

### External CDN assets (tldraw)

**Manual per-tool.** Install `@tldraw/assets`, import `getAssetUrls` from `@tldraw/assets/selfHosted`, pass `assetUrls` to `<Tldraw>`. Copy asset files to the host site's public folder.

**Affected tools:** `patchwork-base/tldraw4`, `patchwork-tools/space`

### Tool-specific CSS

Tools that load CSS via `fetch()` + inject as `<style>` work correctly through the fetch proxy. Recommended pattern for tool-specific CSS.

### Source maps

DevTools source map errors (`connect-src` violation) are harmless. No fix needed.

## Open problems

### Document-level sync filtering

The iframe's ephemeral Repo uses `sharePolicy: () => true`. Restricting to per-tool allowed documents is desirable.

### CodeMirror extension styles on re-mount

When a CodeMirror document is opened, navigated away from (e.g., through a folder), and reopened, the codemirror-markdown theme styles (gutter hiding, content padding) may not re-apply correctly inside the iframe. The extensions load successfully on re-mount, but CodeMirror's internal style injection may not re-inject `<style>` tags that were removed during teardown. This does not affect the host-side patchwork-view. Investigation needed into CodeMirror's style lifecycle in sandboxed iframes.

### Fonts and CORS

CSS `@font-face` with cross-origin URLs requires `Access-Control-Allow-Origin` headers. Since the iframe has an opaque origin, fonts must be served from the host origin. Self-hosting in the host's public folder avoids CORS issues.

### es-module-shims quirks

`script-src` includes `'unsafe-eval'`, `'unsafe-inline'`, and `blob:` for es-module-shims. These are implementation details of shim mode.
