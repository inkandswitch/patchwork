# Sandboxed iframe module loading — architecture and open problems

## What we proved

We can load and run existing JavaScript modules inside an opaque-origin sandboxed iframe (`sandbox="allow-scripts"`, no `allow-same-origin`) without relying on iframe-owned service worker URL interception. The module graph loads, WASM initializes, the tool mounts, and document sync works via MessagePort.

## Architecture

```
HOST PAGE                                SANDBOXED IFRAME (srcdoc, opaque origin)

  +- resolves importmap to               +- boot() IIFE runs inline
  |  absolute host-origin URLs            |
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
  |                                       |
  +- bootstrap handler on port1:          +- capnweb RPC session established on
  |  "load-module-source" requests only   |  rpc port; source hook rewired to use
  |  restricted to importmap URLs         |  hostStub.loadModuleSource()
  |                                       |
  +- HostApi (capnweb RpcTarget) on       +- bootstrap port closed
  |  rpcChannel.port1:                    |
  |  - loadModuleSource(url)              +- fetch proxy rewired to use
  |  - fetchResource(url)                 |  hostStub.fetchResource()
  |  - onMounted(url, toolId)             |
  |  - onOpenDocument(url, ...)           +- core modules loaded via importShim
  |                                       |  (now routed through capnweb RPC)
  +- ResourcePolicy gates all RPC         |
     fetch/load methods                   +- tool renders, events forwarded
                                             to host via capnweb RPC calls
```

### Key files

- `core/elements/src/isolated-patchwork-view/index.ts` — host-side custom element, HostApi, bootstrap + RPC channels
- `core/elements/src/isolated-patchwork-view/srcdoc.ts` — iframe boot script + HTML generator
- `core/elements/src/isolated-patchwork-view/rpc-types.ts` — capnweb RPC contract types (HostRpcContract, IframeRpcContract)
- `core/elements/src/isolated-patchwork-view/resource-policy.ts` — ResourcePolicy interface + AllowAllPolicy default

## Bootstrap sequence

The sandboxed iframe cannot fetch anything on its own. A three-port strategy solves the chicken-and-egg problem of loading capnweb (which is needed for RPC) inside the iframe:

1. **Bootstrap port** — temporary postMessage-based RPC, restricted to importmap URLs only. Used to load es-module-shims source hook and then `importShim("capnweb")`.
2. **RPC port** — capnweb `newMessagePortRpcSession`. Once capnweb is loaded via the bootstrap channel, an RPC session is established here. The source hook and fetch proxy are rewired to use it. The bootstrap port is then closed.
3. **Repo port** — direct `MessageChannelNetworkAdapter` for Automerge document sync. Unchanged from the original design.

## How module resolution works

The es-module-shims `resolve` hook is **synchronous** (not awaited in the es-module-shims source code), so we cannot do async RPC there. Instead:

1. **Importmap handles bare specifiers synchronously.** The host resolves the page's importmap entries to absolute host-origin URLs (e.g., `@automerge/automerge/slim` -> `http://localhost:5173/packages/@automerge/automerge/slim.js`) and sends the resolved importmap to the iframe. es-module-shims uses it internally during its synchronous resolution step.

2. **Relative imports resolve via standard URL resolution.** `./helper.js` relative to `http://localhost:5173/automerge/abc123/src/index.js` produces `http://localhost:5173/automerge/abc123/src/helper.js`. This is synchronous and works fine.

3. **The `source` hook does the heavy lifting.** It's async (awaited in es-module-shims' source code). It receives the already-resolved URL and calls `hostStub.loadModuleSource(url)` via capnweb RPC. The host calls `fetch(url)` — its service worker intercepts Automerge URLs, normal fetch handles everything else — and returns the source text.

## Workarounds we needed

### Chicken-and-egg: loading es-module-shims and capnweb

A sandboxed iframe with no `allow-same-origin` cannot fetch anything — including es-module-shims from a CDN or capnweb from the importmap. The host pre-fetches the es-module-shims source as text and transfers it in the init message. The iframe injects it via `script.textContent`. capnweb is then loaded via `importShim("capnweb")` through the temporary bootstrap channel, which uses the same postMessage RPC that was previously used for all module loading.

### WASM binary loading

Same problem. The host pre-fetches `automerge.wasm` and `subduction.wasm` as ArrayBuffers and transfers them (zero-copy) in the init postMessage. capnweb does not support ArrayBuffer transfer (only Uint8Array), so WASM binaries continue to use raw postMessage.

### `fetch()` calls inside module code

Some modules (notably the non-slim `@automerge/automerge` via `vite-plugin-wasm`) call `fetch()` at evaluation time to load WASM binaries. The es-module-shims source hook only intercepts ES module `import` statements, not runtime `fetch()` calls. So we override `self.fetch` in the iframe to proxy all fetch calls through capnweb RPC to the host, which does the real fetch and returns `{contentType, body}`.

### es-module-shims lexer false-positive on `import` method names

The Automerge Repo class has a method literally named `import(binary, args)`. The es-module-shims lexer misidentifies this as a dynamic `import()` expression and fails to parse it. We work around this in the source hook by rewriting `import(` in method-definition position (preceded by newline + whitespace) to `["import"](`, which is semantically identical JavaScript but doesn't trip the lexer.

## Communication model: capnweb RPC

Host-iframe communication uses [capnweb](https://github.com/cloudflare/capnweb), a JavaScript-native RPC library with object-capability semantics. This replaces the earlier hand-rolled postMessage request/response protocol.

### RPC contracts

**HostRpcContract** (host exposes to iframe):
- `loadModuleSource(url)` — fetch module source text for es-module-shims
- `fetchResource(url)` — fetch any resource (returns content-type + body)
- `onMounted(url, toolId)` — iframe reports successful tool mount
- `onOpenDocument(url, toolId?, title?, docType?)` — iframe requests navigation

**IframeRpcContract** (iframe exposes to host):
- Currently empty — placeholder for future host→iframe calls (navigate, focus, theme)

### Why capnweb

- **Type-safe**: method signatures checked at compile time via `RpcStub<T>`
- **Bidirectional**: both sides can call methods on each other
- **Extensible**: adding a new capability is adding a method, not a message type + handler
- **OCAP foundation**: objects passed by reference become capabilities — the host can pass scoped capability objects to the iframe in the future

## Resource policy

All `loadModuleSource` and `fetchResource` calls on the capnweb RPC channel are gated by a `ResourcePolicy` interface:

```typescript
interface ResourcePolicy {
  canFetch(url: string): boolean;
}
```

The host creates a policy per tool via an optional `createPolicy(toolId)` factory passed to `registerIsolatedPatchworkViewElement`. The default is `AllowAllPolicy` (permits everything). Violations are logged on the host console and thrown as RPC errors that propagate to the iframe.

The bootstrap channel is separately hardened: it only serves URLs that appear in the resolved importmap.

## Security model: CSP and the host as gatekeeper

### Two-layer isolation

The sandboxed iframe is isolated by two complementary mechanisms:

1. **Sandbox (browser-enforced):** `sandbox="allow-scripts"` with no `allow-same-origin` gives the iframe an opaque origin. It cannot access the host page's DOM, cookies, localStorage, IndexedDB, or service workers. This is the DOM/storage isolation boundary.

2. **CSP (browser-enforced):** A Content-Security-Policy meta tag restricts what origins the iframe can load resources from. This is the network isolation boundary — it prevents exfiltration to external servers.

### CSP policy

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

- **`default-src 'none'`** — deny everything not explicitly allowed. This means any fetch directive not listed (e.g., `connect-src`) defaults to blocking, not to the host origin.
- **`connect-src blob:`** — blocks `fetch()`, `XMLHttpRequest`, `WebSocket`, `EventSource`, and `navigator.sendBeacon()` to all origins. Only `blob:` URLs are permitted because es-module-shims creates blob URLs internally and `import()`s them, which the browser treats as a connect-src check. Module loading and resource fetching are handled through capnweb RPC over MessagePort, which is not subject to `connect-src`.
- **`script-src`** — allows inline scripts (needed for the boot IIFE), eval (needed by es-module-shims for module graph execution), WASM compilation, and blob URLs (es-module-shims creates these internally for module evaluation).
- **`img-src`, `style-src`, `font-src`, `media-src`** — allow the host origin for browser-initiated subresource loads (CSS `url()`, `<img src>`, `@font-face`, etc.). These are the only directives that permit the host origin.
- **`frame-src 'none'`** — blocks nested iframes. A loaded child document would have its own CSP from its own response headers, not this one, so allowing frame-src would not extend these restrictions to the child.
- **`base-uri 'none'`** — blocks `<base href="...">`, which could otherwise change how relative URLs resolve. This directive does not fall back to `default-src`; if absent, any URI is allowed.
- **`worker-src 'none'`** — blocks web workers and service workers (also blocked by the sandbox, but defense in depth).
- **`object-src 'none'`** — blocks plugins (Flash, etc.).

The host origin is dynamic (different in dev vs production) and is injected into the srcdoc HTML at iframe creation time via the `getSrcdocHtml(hostOrigin)` function.

### The network boundary

The network boundary is **not** CSP alone. It is the combination of three mechanisms:

1. **Sandbox (browser-enforced):** opaque origin prevents DOM/storage/service-worker access.
2. **CSP (browser-enforced):** blocks direct network access from script APIs (`connect-src 'none'`) and restricts browser-initiated subresource loads to the host origin.
3. **ResourcePolicy on host RPC methods (application-enforced):** gates what the host will actually fetch on behalf of the iframe when it receives `loadModuleSource` or `fetchResource` calls via capnweb RPC.

CSP does not constrain what the host does after receiving an RPC call — if the ResourcePolicy permits a URL, the host will fetch it regardless of CSP. Conversely, CSP blocks browser-level network access that bypasses the RPC layer entirely. Both are needed.

### Access control layers

1. **Bootstrap channel** — restricted to importmap URLs only. Short-lived, closed after capnweb loads.
2. **capnweb RPC channel** — gated by `ResourcePolicy`. The host enforces per-tool policies on `loadModuleSource` and `fetchResource` calls.
3. **Fetch proxy constraints** — the iframe's `self.fetch` override only allows GET and HEAD methods with no request body, preventing tool code from using `fetchResource` as a general-purpose host-side request primitive.
4. **CSP** — browser-enforced. Blocks direct script-initiated network access (`connect-src 'none'`) and restricts browser-initiated subresource loads to the host origin.

### Resource loading: two categories

There are two categories of resource loading in the browser, and the current implementation handles them differently:

1. **JavaScript-initiated loading** — `import()`, `fetch()`, `XMLHttpRequest`, etc. `import()` goes through the es-module-shims source hook (capnweb RPC to host). `fetch()` goes through the global override (capnweb RPC to host, restricted to GET/HEAD with no body). Direct `XMLHttpRequest`/`fetch` calls that bypass the override are blocked by `connect-src 'none'`. The host has full control over what it returns, gated by ResourcePolicy.

2. **Browser-engine-initiated loading** — CSS `url()`, `<img src>`, `@font-face`, `<link rel="stylesheet">`, etc. These go directly from the browser to the host as real HTTP requests, bypassing our JavaScript-level interception. CSP allows them for the host origin only (`img-src`, `style-src`, `font-src`, `media-src`), but the host currently serves them without per-tool policy enforcement.

For future capability enforcement on browser-initiated loads, the host would need to identify which tool is making the request. Possible approaches include unique path prefixes per tool session, or server-side request filtering.

## Open problems

### Document-level sync filtering

The iframe's ephemeral Repo currently uses `sharePolicy: () => true`, meaning it can sync any document the host repo knows about. Restricting this to a per-tool allowed set is desirable but the implementation approach needs further discussion. Options include using the host repo's shareConfig (per-peer filtering), a proxy repo (filtered bridge), or a custom network adapter with message-level filtering.

### Third-party CDN resources

Some tools reference resources from external CDNs (e.g., tldraw loads icons from `cdn.tldraw.com`). These are correctly blocked by CSP — only the host origin is allowed.

Tools that need external assets must either bundle them or configure their libraries to load assets from the host origin. For example, tldraw supports self-hosting assets via its `assetUrls` configuration.

### Fonts and CORS

`@font-face` with cross-origin URLs requires the server to set `Access-Control-Allow-Origin` headers (fonts are one of the few resource types where CORS is enforced even for subresource loads). Since the iframe has an opaque origin, the host may need to serve fonts with `Access-Control-Allow-Origin: *`.

### es-module-shims quirks

The `script-src` directive includes `'unsafe-eval'`, `'unsafe-inline'`, and `blob:` specifically for es-module-shims. It needs eval for module graph execution, inline scripts for the boot IIFE, and blob URLs for internal module evaluation via dynamic `import()`. These are implementation details of es-module-shims' shim mode, not fundamental to the architecture — a different module loading strategy (e.g., SystemJS) might have different CSP requirements.
