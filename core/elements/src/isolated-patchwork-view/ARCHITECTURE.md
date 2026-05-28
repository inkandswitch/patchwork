# Sandboxed iframe module loading — architecture and open problems

> **Note:** For the threat model, design rationale, and alternatives considered, see [`core/DESIGN-tool-isolation.md`](../../../DESIGN-tool-isolation.md). This document covers implementation details.

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
  |  - loadModuleSource(url)              |  load() → importShim(packageUrl)
  |  - fetchResource(url)                 |
  |  - onMounted(url, toolId)             +- sync APIs now work locally:
  |  - onOpenDocument(url, ...)           |  getFallbackTool(), getRegistry().get()
  |                                       |  filter(), loadAll(), etc.
  +- PackageUrlMapper:                     |
  |  - toPackageUrl: automerge → name      +- registerPatchworkViewElement({ repo })
  |  - toAutomergeUrl: name → automerge   |  no special callbacks needed
  |  - rewriteAutomergeUrls in source     |
  |                                       +- patchwork-view resolves tool via
  +- Pushes registry updates to iframe    |  local pre-populated registry,
  |  via iframeStub.onPluginRegistered()  |  triggers load() → importShim → RPC
  |  when ModuleWatcher re-registers      |
  |                                       +- tool renders, events forwarded
  +- ResourcePolicy gates RPC methods        to host via capnweb RPC calls
```

### Key files

- `core/elements/src/isolated-patchwork-view/index.ts` — host-side custom element, HostApi, PackageUrlMapper, PluginRegistryTarget, registry push subscriptions, bootstrap + RPC channels
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
2. Calls `registryCap.list(type)` for each type to get all plugin metadata (with package-name `importUrl` values)
3. Registers each as a `LoadablePlugin` in the local registry with a `load()` function that:
   - Calls `importShim(meta.importUrl)` → es-module-shims source hook → `loadModuleSource` RPC → host serves source
   - Finds the matching plugin in `mod.plugins` by both `id` AND `type` (to avoid collisions when a module exports both a datatype and a tool with the same ID)
   - Calls the plugin's own `load()` function to get the implementation
   - Returns the implementation

After pre-population, sync APIs like `getRegistry("codemirror:extension").filter(...).loadAll(...)`, `getFallbackTool(doc)`, `getSupportedToolsForType(type)` all work against local data. Module code is only loaded on demand when `load()` or `loadAll()` is called.

### Registry push updates

The host's ModuleWatcher may re-register plugins with new `importUrl` values after the iframe boots. To keep the iframe's registry in sync:

1. After RPC setup, the host subscribes to `"registered"` events on all host registries
2. When a plugin is re-registered, the host converts it to `PluginMetadata` (with package URL) and calls `iframeStub.onPluginRegistered(meta)`
3. The iframe's `IframeApi.onPluginRegistered()` re-registers the plugin in the local registry with the updated `importUrl`

This ensures the iframe always has current plugin metadata without polling.

### Entry point resolution

During pre-population, `#toMetadata` calls `resolvePluginEntryUrl` to resolve each plugin's `package.json` and find its entry point (e.g., `dist/index.js`). The full entry URL is then converted to a package URL. Plugins that fail resolution (automerge document not synced locally) return `null` and are filtered out — they simply won't appear in the iframe's registry.

## How module resolution works

The es-module-shims `resolve` hook is **synchronous** (not awaited in the es-module-shims source code), so we cannot do async RPC there. Instead:

1. **Importmap handles bare specifiers synchronously.** The host resolves the page's importmap entries to absolute host-origin URLs and sends the resolved importmap to the iframe.

2. **Relative imports resolve via standard URL resolution.** `./helper.js` relative to `http://localhost:5173/pkg:@patchwork--folder/dist/index.js` produces `http://localhost:5173/pkg:@patchwork--folder/dist/helper.js`. The `pkg:` prefix is preserved.

3. **The `source` hook does the heavy lifting.** It's async. It receives the already-resolved URL and calls `hostStub.loadModuleSource(url)` via capnweb RPC. The host resolves package URLs via `PackageUrlMapper.toAutomergeUrl()`, fetches the real source, rewrites automerge URL strings via `rewriteAutomergeUrls()`, and returns the source text.

## Plugin registry capability

The `PluginRegistryCapability` is used primarily for pre-population at boot. Its methods:

- `listRegistryTypes()` — discover all registry types from the host
- `list(pluginType)` — list all plugins of a given type with full entry URLs resolved and converted to package-name `importUrl` values. Plugins that can't be resolved (not synced) are filtered out.
- `get(pluginId)` — get a single plugin by ID
- `getSupportedToolsForType(type)` — mirrors `getSupportedToolsForType(type)` from tools.ts
- `getFallbackTool(docUrl)` — mirrors `getFallbackTool(doc)`, takes docUrl since doc objects can't cross RPC
- `getSupportedTools(docUrl)` — mirrors `getSupportedTools(doc)`

## Package URL scheme

Tool/plugin source code lives in automerge documents. The `PackageUrlMapper` replaces automerge document ID segments in URLs with package names (from `package.json`) to hide tool source code locations from the iframe:

```
Real:   http://host/%automerge%3Axyz.../dist/index.js
Package: http://host/pkg:@patchwork--folder/dist/index.js
```

**`toPackageUrl(url, name?)`**: Parses the URL, splits path segments, URI-decodes each, checks with `isValidAutomergeUrl()`. Replaces the automerge segment with the sanitized package name (or a fallback counter if no name is provided).

**`toAutomergeUrl(url)`**: Scans for `pkg:<name>/` (with trailing slash to prevent prefix matching — `pkg:folder/` must not match `pkg:folder-viewer/`) and replaces back.

**`rewriteAutomergeUrls(source)`**: Replaces decoded automerge URL strings in module source text before sending to the iframe. Ensures `importUrl` literals in plugin definitions use package names instead of automerge URLs.

**Security rule:** Automerge URLs flow iframe → host only. They never flow host → iframe.

## Communication model: capnweb RPC

Host-iframe communication uses [capnweb](https://github.com/cloudflare/capnweb), a JavaScript-native RPC library with object-capability semantics.

### RPC contracts

**HostRpcContract** (host exposes to iframe):
- `getPluginRegistry()` → `PluginRegistryCapability`
- `loadModuleSource(url)` — resolves package URLs, handles folder URLs via re-export stubs, rewrites automerge URL strings
- `fetchResource(url)` — resolves package URLs, returns content-type + body
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

All `loadModuleSource` and `fetchResource` calls are gated by a `ResourcePolicy` interface. `pkg:` URLs bypass the policy (resolved by PackageUrlMapper to real automerge-backed paths). Other URLs are checked before fetching.

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
2. **capnweb RPC** — gated by ResourcePolicy; `pkg:` URLs always allowed
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

See DESIGN doc sections 12–16 for the full list and analysis of open problems. Key items relevant to this architecture:

### Plugin discovery in host context

Plugin entry modules currently execute in the host page context (`import()` in `ModuleWatcher`), bypassing the iframe sandbox entirely. This is the most severe security gap. See DESIGN doc section 12.

### Document access via repo

The iframe's ephemeral Repo uses `sharePolicy: () => true` and the host repo responds to sync requests for any document. A tool that knows a document ID can sync it. The severity depends on how the tool obtains document IDs — see DESIGN doc section 5 for detailed analysis of the four discovery vectors.

### `suggestedImportUrl` leaks tool source document IDs

Most documents contain a `@patchwork.suggestedImportUrl` field with the raw automerge URL of the tool that created them, bypassing the package URL mapping. See DESIGN doc section 13.

### Tool-specific resource whitelisting

The current `RestrictivePolicy` blocks all cross-origin URLs. Some tools need external URLs (e.g., tldraw CDN, OpenRouter). Needs a per-tool whitelisting mechanism. See DESIGN doc section 7.

### Integrating providers

Providers have been integrated via capnweb RPC but can request/respond with anything. Security implications not yet analyzed. See DESIGN doc section 14.

### Element architecture

`isolated-patchwork-view` is a pragmatic POC. Migration to `patchwork-box` or `withIsolation()` is planned. See DESIGN doc section 15.

### CodeMirror extension styles on re-mount

When a CodeMirror document is opened, navigated away from (e.g., through a folder), and reopened, the codemirror-markdown theme styles (gutter hiding, content padding) may not re-apply correctly inside the iframe. The extensions load successfully on re-mount, but CodeMirror's internal style injection may not re-inject `<style>` tags that were removed during teardown. This does not affect the host-side patchwork-view. Investigation needed into CodeMirror's style lifecycle in sandboxed iframes.

### Fonts and CORS

CSS `@font-face` with cross-origin URLs requires `Access-Control-Allow-Origin` headers. Since the iframe has an opaque origin, fonts must be served from the host origin. Self-hosting in the host's public folder avoids CORS issues.

### es-module-shims quirks

`script-src` includes `'unsafe-eval'`, `'unsafe-inline'`, and `blob:` for es-module-shims. These are implementation details of shim mode.
