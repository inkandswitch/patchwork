# Tool Isolation Architecture

## Threat model

Our chief concern is mischievous or malicious tool authors. We want users to be able to safely run third-party tools in their patchwork.

The attacker is a tool author who publishes a tool that users install. The attacker does not control the Patchwork host application or the sync server. The tool is standard JavaScript — it can do anything JavaScript can do within whatever execution context it's given.

We want to prevent one attack:

1. **Unauthorized data access.** A tool must not access data that wasn't handed to it by the user. This includes all keyhive keys as well as documents belonging to other tools — accessing those could allow a malicious tool to damage the user's environment (for example, by modifying another tool's source code).

**Trust boundary.** The Patchwork host application and its built-in code are trusted. Third-party tool code is untrusted. The `<patchwork-isolation>` element wraps an arbitrary subtree of the host DOM and runs it inside a sandboxed iframe. In the default frame layout, the isolation boundary wraps the main document view, context sidebar, and their providers (comments, focus). The document toolbar runs outside the isolation boundary in the host.

**No server enforcement.** Patchwork is local-first. There is no server mediating tool access to documents. All isolation must happen in the browser, using the browser's own security primitives.

## Out of scope

- Preventing data exfiltration (sending data to external servers).
- Granular capability-based or tool-specific access control. In this architecture, we are aiming for a simple implementation that can handle a small number of critical guarantees with minimal disruption to the existing system.

## Architecture overview

```
 HOST (trusted)                           IFRAME (untrusted, opaque origin)
┌──────────────────────────────────────┐  ┌────────────────────────────────────┐
│                                      │  │                                    │
│  Isolation Element                   │  │  Reconstructed DOM Tree            │
│  ┌────────────────────────────────┐  │  │  ┌──────────────────────────────┐  │
│  │ Serializes child subtree,      │  │  │  │ <repo-provider>              │  │
│  │ manages iframe lifecycle       │  │  │  │  answers repo:handle-        │  │
│  └────────────────────────────────┘  │  │  │  descriptor subscriptions    │  │
│                                      │  │  │  ┌────────────────────────┐  │  │
│  ┌────────────────────────────────┐  │  │  │  │ Providers (local)      │  │  │
│  │ Intermediary Repo (ephemeral)  │  │  │  │  │ - comments-provider    │  │  │
│  │                                │  │  │  │  │ - focus-provider       │  │  │
│  │ ┌──────────────────────────┐   │  │  │  │  ├────────────────────────┤  │  │
│  │ │ Allowlist                │   │  │  │  │  │ Tool Views             │  │  │
│  │ │ - root docs + transitive │   │  │  │  │  │ - main document view   │  │  │
│  │ │ - contact URL            │   │  │  │  │  │ - context sidebar      │  │  │
│  │ │ - unknown: prompt *      │   │  │  │  │  └────────────────────────┘  │  │
│  │ │ - user-approved          │   │  │  │  └──────────────────────────────┘  │
│  │ ├──────────────────────────┤   │  │  │                                    │
│  │ │ Denylist                 │   │  │  │  ┌──────────────────────────────┐  │
│  │ │ - account doc            │   │  │  │  │ In-memory Repo               │  │
│  │ │ - module settings        │   │  │  │  │ (no keyhive, no storage)     │  │
│  │ │ - tool source code       │   │  │  │  └──────────┬───────────────────┘  │
│  │ │ - plugin import URLs     │   │  │  │             │                      │
│  │ │ (takes precedence)       │   │  │  │  ┌──────────┴───────────────────┐  │
│  │ └──────────────────────────┘   │  │  │  │ Module Loader                │  │
│  │                                │  │  │  │ (es-module-shims source hook)│  │
│  │ Signs "signable" commits       │  │  │  │ - all imports via RPC        │  │
│  │ with isolation identity        │  │  │  │ - sees pkg: URLs only        │  │
│  └───────────────┬────────────────┘  │  │  └──────────────────────────────┘  │
│                  │                   │  │                                    │
│  ┌───────────────┴───────────────┐   │  │  ┌──────────────────────────────┐  │
│  │ Keyhive Isolation Identity    │   │  │  │ Fetch Proxy                  │  │
│  │ - attenuated access           │   │  │  │ - host-origin fetch() → RPC  │  │
│  │ - no account/settings/plugins │   │  │  │ - <link> interception        │  │
│  └───────────────────────────────┘   │  │  └──────────────────────────────┘  │
│                                      │  │                                    │
│  ┌────────────────────────────────┐  │  │  ┌──────────────────────────────┐  │
│  │ Plugins RPC Handler            │  │  │  │ Package Registry             │  │
│  │ - fetch-package: pkg: → real   │  │  │  │ - pre-populated (pkg: URLs)  │  │
│  │   automerge URL, return src    │  │  │  │ - lazy-loads implementations │  │
│  │ - fetch-resource: resolve &    │  │  │  │ - push updates from host     │  │
│  │   return host-origin assets    │  │  │  └──────────────────────────────┘  │
│  │ - PluginsUrlMapper (pkg: ↔     │  │  │                                    │
│  │   automerge bidirectional)     │  │  │                                    │
│  ├────────────────────────────────┤  │  │                                    │
│  │ Providers Bridge               │  │  │                                    │
│  │ - host-side allowlist:         │  │  │                                    │
│  │   patchwork:contact,           │  │  │                                    │
│  │   patchwork:selected-doc       │  │  │                                    │
│  │ - value filter: checks URLs    │  │  │                                    │
│  │   against repo allowlist       │  │  │                                    │
│  │ - all other types rejected     │  │  │                                    │
│  └────────────────────────────────┘  │  │                                    │
│                                      │  │                                    │
└──────────────────┬───────────────────┘  └──────────────────┬─────────────────┘
                   │                                         │
                   │   ┌─────────────────────────────────┐   │
                   │   │       RPC (MessagePort)         │   │
                   ├───┤  - fetch-package (module src)   ├───┤
                   │   │  - fetch-resource (assets)      │   │
                   │   │  - registry operations          │   │
                   │   │  - navigation/access requests   │   │
                   │   │  - providers-bridge (subscribe) │   │
                   │   ├─────────────────────────────────┤   │
                   │   │  Automerge Sync (MessagePort)   │   │
                   └───┤  - document data flow           ├───┘
                       │  - allowlist/denylist enforced  │
                       │  - "signed or signable" filter  │
                       │  - unsigned in → signed out     │
                       └─────────────────────────────────┘

* unknown: prompt — documents not in the host repo are not auto-allowlisted;
  the user is prompted via window.confirm — see the Allowlist section.
```

> **Not yet implemented (future / Keyhive):** the "Keyhive Isolation Identity" box, the "Signs 'signable' commits with isolation identity" line, and the sync-channel "'signed or signable' filter" / "unsigned in → signed out" notes describe the Keyhive-enabled design. Today the intermediary holds no isolation identity and signs nothing, and edits flow through unsigned. See [Security without Keyhive](#security-without-keyhive).

## Security considerations

**A key security invariant is controlling which automerge URLs or document IDs the isolated context is able to learn about.**

With this design, Keyhive provides three main guarantees. _(These describe the Keyhive-enabled design, which is **not yet implemented** — see [Keyhive integration (future)](#keyhive-integration-future). For the posture as it stands today, see [Security without Keyhive](#security-without-keyhive).)_

- Tools will not be able to exfiltrate document **access**: because access is cryptographically key-gated and no keys cross the boundary, a tool cannot delegate the capability to read a document to anyone else. (It can still exfiltrate document *data* it was given, and still access/edit allowlisted documents while running in Patchwork.)
- Keyhive protects a small and critical set of documents (account doc, module settings, plugin source code) from ever being accessed by the tool.
- If the isolation identity behaves badly, access can be revoked without the user losing their entire device identity. However, we don't currently have anything in place to trace the source of bad edits to particular tools effectively.

Because we use a shared Keyhive isolation identity for all isolated contexts, the isolation identity has access to all user documents which are outside of the critical protected set. These documents are vulnerable if a user doesn't want particular tools to access them. (The protected set could be expanded and user-specific, but there will likely be cases where a user wants only a subset of their tools to have access.)

Given the transitive allowlist population which we use for the sake of reasonable UX, it should be assumed that once a tool discovers an automerge URL, it will be able to access and modify that document (because it could write it into an allowed document and then get access on a future load). These documents can be best protected by preventing the tool from learning their URLs. (Though as a final fallback, the isolation identity can be revoked.)

Each component described below should be evaluated in terms of whether it leaks document IDs to the iframe or provides a channel through which the iframe could discover them.

### Security without Keyhive

The Keyhive pieces above are **not yet implemented** (see [Keyhive integration (future)](#keyhive-integration-future)). Today the intermediary is a plain repo enforcing the allowlist/denylist in JavaScript, syncing under the user's full device identity, with no encryption in the boundary.

**The in-scope guarantee still holds.** Preventing *unauthorized data access* depends only on controlling which document IDs the tool can learn — and the mechanisms that do this (the opaque-origin sandbox, the allowlist/denylist gate, the `pkg:` scheme + `containsAutomergeUrl` filter, the providers value filter, the no-auto-allowlist prompt) are all pure browser/JavaScript and need nothing from Keyhive. A tool still cannot reach documents the user didn't give it.

**But protection is weaker, because nothing is encrypted — an ID *is* access.** Two consequences:

- For documents the user *did* authorize (out of scope either way): with Keyhive a tool could exfiltrate the data but not *access* (access is key-gated and non-delegable); without Keyhive it can exfiltrate both, since leaking the URL is enough to grant access.
- There is no cryptographic backstop for the in-scope boundary: any sandbox escape, `access()` bug, or denylist gap that leaks an ID *is* a grant of access, with no second line of defense, no attenuated identity (a bypass reaches everything the device can read, including the protected set), no revocation, and no signed/attributed edits.

In short, without Keyhive the design is **policy enforcement over which IDs leak, not a cryptographic access guarantee** — adequate against a buggy or moderately adversarial tool, but the depth Keyhive adds (encrypted protected set, attenuated identity, non-delegable access, revocation) is absent.

## Components

### Sandboxed iframe (opaque origin)

The primary isolation boundary. Tool code runs inside an `<iframe sandbox="allow-scripts">` without `allow-same-origin`. This gives the iframe an opaque origin — the browser's same-origin policy prevents it from accessing the host's DOM, cookies, localStorage, IndexedDB, or service workers.

**Why this is needed:** Without origin isolation, a tool could read or modify any data accessible to the host page. The opaque-origin sandbox is the strongest isolation primitive browsers provide and is the foundation all other mechanisms build on.

### Isolation element

A host-side custom element (`<patchwork-isolation>`) that manages the boundary between trusted host code and untrusted tool code, setting up the iframe, establishing communication channels, and enforcing access control. It wraps an arbitrary subtree of the host DOM and runs it inside a sandboxed iframe. It recursively serializes its child elements (tag names, attributes, and nested children) into a transferable descriptor, then reconstructs the same DOM structure inside the iframe. All `doc-url` attributes found anywhere in the serialized tree become root URLs for the document allowlist.

The element manages the iframe lifecycle, coordinates all communication channels (RPC, sync, bootstrap), and enforces access control. Host-side children are removed from the DOM after serialization to prevent duplicate rendering.

**Theme-matched first paint.** The iframe is a separate document that would otherwise paint white until the theming tool boots inside it. To avoid that flash, the host reads its own current appearance (`readHostAppearance`) and bakes it into the iframe's static `srcdoc`, so the iframe's first frame already matches. This read is deliberately **tool-agnostic** — it does not depend on the theming tool's CSS variables, attribute conventions, or palette (the theming tool is swappable, and the platform must not couple to it). It reads only resolved browser values: the host's actual painted background (found by walking up from the isolation element to the first ancestor with a non-transparent computed `backgroundColor`, whatever produced it) and the resolved `color-scheme` (a CSS standard property). The real theme is then applied to the iframe's content as normal when the theming tool boots inside it; because the first paint already matched, there is no visible transition. (The native `window.confirm()` access/navigation prompts are browser chrome and cannot be themed.)

### Intermediary Repo & document allowlist/denylist

An ephemeral host-side Automerge repo (in-memory, no storage) that sits between the host's main repo and the iframe's repo. It enforces which documents can sync to the iframe using two mechanisms:

- **Allowlist** — documents the tool is permitted to access.
- **Denylist** — documents that are never permitted to cross the isolation boundary. The denylist takes precedence over the allowlist.

Access is enforced via `shareConfig.access()` on the intermediary repo's network adapter, which gates every document sync request.

**Why this is needed:** The opaque-origin iframe prevents tools from accessing host-side storage, but tools still receive documents via Automerge sync. Without the allowlist/denylist, a tool could call `repo.find()` with any document URL and receive it. The intermediary repo ensures tools only see documents the user has authorized.

#### Default assumptions: plugin code vs. documents

We consider all _code_ from the patchwork plugin registries to be authorized by default, but access to all plugin _documents_ to be unauthorized. In other words:

- **Code is freely available.** Tool source code is loaded into the iframe via the host-mediated module loader and `pkg:` URL scheme (see below). Any plugin registered in the host's registries can be imported. This is necessary for many tools to function — they need to load their own code and the code of plugins they use inside.
- **Documents are restricted by default.** A tool only receives documents that have been explicitly allowlisted. The tool cannot discover or access arbitrary documents just because it knows (or guesses) their URLs.

This asymmetry reflects the threat model: code is published by tool authors and is the same for all users, so exposing it to other tools reveals no user data. Documents contain user data and must be individually authorized.

#### Denylist

The denylist is a shared singleton populated at boot and updated dynamically. It blocks sensitive system documents from ever syncing to the iframe, regardless of whether they appear in document content or are requested by the tool. Denylisted document categories:

1. **Account document** — the user's account doc (`window.accountDocHandle`).
2. **Module settings documents** — all `ModuleSettingsDoc` URLs from `window.patchwork.packages`.
3. **Tool/package source code** — for each module settings doc, all referenced module entries (branches docs, folder docs, and their children) are transitively denylisted.
4. **All plugin import URLs** — as a catch-all, every `importUrl` from every plugin registry is denylisted along with its transitive module entries.

The denylist also watches plugin registries for new registrations and dynamically denylists their source code documents as they appear.

**Dynamic denylist expansion.** When a URL is about to be added to the allowlist (e.g., discovered in document content), it is first checked against the denylist _and_ inspected for sensitive types. If the document turns out to be a `branches` doc or `patchwork:module-settings` doc, it is dynamically denylisted (along with its children) instead of being allowlisted. This prevents sensitive documents from leaking through user content that happens to reference them.

#### Allowlist

The allowlist is seeded from all `doc-url` attributes found in the serialized child tree, plus the user's contact document URL (read from the account doc), which we include as a special case. It is expanded through two mechanisms:

1. **Transitive discovery.** Each root document's content is scanned for embedded automerge URLs (recursively walking objects, arrays, and strings). All discovered URLs are added to the allowlist (unless denylisted). This reflects the assumption that if the user opened a document, its referenced children are authorized for the tool rendering it.

2. **User approval.** When the iframe requests a document that is not on the allowlist, the user is prompted via `window.confirm()` and can approve access explicitly. If the document is one the host repo already knows about, the allowlist is first refreshed (re-scanning all root documents for new URLs, e.g. a reference the user just typed) and the prompt is skipped if it now matches. Documents the host has never seen (newly created by the iframe, added by a collaborator, or embedded in the tool) skip that refresh — a root re-scan cannot surface a document the host has never seen — and prompt directly. Unknown documents are **not** auto-allowlisted; this prevents a tool from silently gaining access to any URL it constructs, at the cost of prompting for documents the iframe itself just created. Once the Author ID API is available, documents created by the iframe's own author ID will be auto-allowlisted while other unknown documents continue to prompt. _(See "Waiting on automerge/keyhive teams" below.)_

### Keyhive integration (future)

> **Not yet implemented.** None of this section is wired into the isolation boundary today: the intermediary repo is a plain Automerge `Repo` running with the user's full device identity, and the iframe repo has no keyhive. These are the guarantees the design will gain once Keyhive (and the supporting Automerge APIs) land — see "Waiting on automerge/keyhive teams". For the security posture as it stands today, see [Security without Keyhive](#security-without-keyhive) above.

Keyhive adds cryptographic identity and access control to the system. Three aspects are relevant to isolation:

**1. Isolation identity.** A separate keyhive identity with attenuated access, used at the intermediary repo instead of the user's primary device identity. This identity has access only to user documents — not the account document, module settings, or tool packages. This strengthens guarantees (even a compromised intermediary repo can't access sensitive documents) and protects the user's device keys from exposure.

**2. No keyhive inside the iframe.** The iframe repo does not use keyhive and receives no keys. This is deliberate: we do not want tools or their authors to be able to delegate access to documents, and since we are not protecting against exfiltration, there is no benefit to signing edits inside the iframe.

**3. Unsigned edits signed at the intermediary.** Tools in the iframe make unsigned edits to documents. These edits flow back to the intermediary repo over the sync connection. The bridge is configured to only accept "signed or signable" commits — it signs signable commits with the isolation identity's author ID and drops anything that is mis-attributed. This ensures all changes that enter the main document graph are properly signed, even though the tool never had keys. _(Not yet implemented: today the sync connection is a plain network adapter with no signed-or-signable filter, so tool edits flow through unsigned and are not dropped.)_

**Why this is needed:** Keyhive requires all changes to be signed before they are accepted into the document graph. Without the unsigned→signed bridge, tool edits would be dropped. The isolation identity adds defense-in-depth by limiting what the intermediary repo itself can access.

### Module loader & host-mediated fetch proxy

The iframe's opaque origin prevents it from making same-origin requests to the host — the browser blocks these by default. However, tools need to load JavaScript modules and static resources (CSS, images, etc.) to function. To make this possible, the isolation system introduces two proxy channels that selectively bridge the gap:

1. **Module imports** (`fetch-package` RPC) — every ES module import goes through the `es-module-shims` source hook, which sends the URL to the host. The host resolves `pkg:` URLs back to real automerge paths via the `PluginsUrlMapper`, resolves bare automerge URLs to package entry points, and passes through other URLs. The source text and resolved URL are returned to the iframe.

2. **Resource fetches** (`fetch-resource` RPC) — the iframe installs a `fetch()` override that intercepts all requests to host-origin URLs and forwards them to the host via RPC. The host resolves the URL and returns the response body and content type. Non-host-origin fetches pass through to the browser's native `fetch`.

Additionally, host-origin `<link>` elements are intercepted **synchronously at insertion time** by patching `Node.prototype.appendChild`/`insertBefore`. A MutationObserver is too late: native `<link>` elements make direct browser requests (which CORS-fail from the opaque origin) the instant the element is inserted — before any async observer callback can run — so the node must be handled before it enters the DOM. Two `rel` types are intercepted (both produced by tool/bundler code such as Vite's `__vitePreload` or the theming tool's `ensureThemeLink`):

- **`rel="stylesheet"`** — a `<style>` element is substituted in the link's place and its content fetched through the proxy; the `<link>` itself never enters the DOM, so no native request is made. The original link → substituted `<style>` is tracked in a `WeakMap` (with patched `removeChild`/`Element.remove`) so a later link removal (e.g. theme deregistration) also removes the `<style>`.
- **`rel="modulepreload"`** — flipped to `rel="modulepreload-shim"`. The browser ignores the unknown rel (no native fetch), while es-module-shims honors it and preloads the chunk through its source hook (and thus the `fetch-package` RPC). The chunk also loads via the dynamic `import()` (which es-module-shims rewrites to `importShim` in shim mode); the shim preload just warms its cache in parallel.

Both substitutions route the actual fetch through the `fetch()` override → `fetch-resource` RPC, so the host-side automerge filter still applies — a stylesheet href containing a raw automerge URL is rejected like any other (it will fail to load rather than CORS-error).

**Security consideration:** These proxies re-open a channel that the opaque origin otherwise closes. Bundled non-automerge assets (host-origin JS, CSS, images, etc.) are not sensitive — they are the same for all users and do not contain user data, so serving them freely is fine. However, requests that resolve to automerge document URLs are sensitive: a tool could construct URLs that reach the service worker and load arbitrary automerge documents as source text. The host-side proxy filters these out: both `fetch-package` and `fetch-resource` reject any incoming request whose URL contains a raw AutomergeUrl (`containsAutomergeUrl`), _before_ resolution. Legitimate iframe URLs only ever use the opaque `pkg:` scheme, so a raw AutomergeUrl can only come from a tool attempting to bypass the sync allowlist. The only automerge-backed fetches that proceed are those the `PluginsUrlMapper` itself produces by translating a known `pkg:` URL — i.e. documents the isolation boundary registered in the `pkg:` registry.

### `pkg:` URL scheme

Tool code inside the iframe never sees real automerge document IDs for plugin source code. Instead, plugin import URLs are rewritten to use an opaque `pkg:` scheme before being sent to the iframe. For example, a plugin's automerge URL like `automerge:3Dz.../dist/index.js` becomes `pkg:@patchwork--codemirror-base/dist/index.js`.

The `PluginsUrlMapper` maintains a bidirectional mapping between automerge URL segments and package names. When the iframe requests a `pkg:` URL via the module loader, the host converts it back to the real automerge URL, fetches the source, and returns it.

This serves two purposes:

1. **Prevents document ID leakage.** Automerge URLs are valid document identifiers — if a tool learned them, it could attempt to request those documents via `repo.find()` on the Automerge sync channel, bypassing the fetch proxy entirely. The `pkg:` scheme hides these IDs so that tools cannot learn plugin document IDs in the first place.
2. **Provides hierarchical URLs.** Package-style URLs (`pkg:@scope--name/path`) support relative import resolution, which bare automerge URLs do not.

Heads hashes (used for pinning to specific document versions) are preserved by encoding them as a URL-encoded fragment in the package URL (e.g., `pkg:@patchwork--folder%23headsHash`).

Resolved module URLs returned to the iframe are prefixed with the host origin (e.g., `https://host/pkg:@scope--name/dist/index.js`) so that relative imports in code-split packages resolve correctly. The host-side RPC handler strips the prefix when receiving chunk requests.

### Package registry in iframe

At boot, the host pre-populates the iframe's plugin registries with metadata for all available plugins (with import URLs already rewritten to `pkg:` URLs). Plugins are registered as lazy-loading entries — their implementations are only fetched (via the module loader) when actually used. The host watches registries for new registrations and pushes updates to the iframe with mapped URLs.

**Why this is needed:** Tools use plugin registries to discover and load other tools (e.g., to render embedded content). Without pre-population, the iframe would need direct access to the host's registries. Lazy-loading ensures only the plugins a tool actually uses are loaded into the iframe.

### Repo provider in iframe

The iframe registers a `<repo-provider>` custom element and wraps all reconstructed content inside it. This mirrors the host bootloader pattern — `<repo-provider>` answers `repo:handle-descriptor` subscriptions with an identity response (no remapping), which is required by `OverlayRepo.find()`. Without it, every `patchwork-view` in legacy mode (with `doc-url`) would hang forever waiting for a descriptor response.

### Providers bridge

DOM events do not cross iframe boundaries, so provider subscriptions (`patchwork:subscribe` events) from tools inside the iframe cannot reach host-side providers. The providers bridge relays a configurable set of subscription types across the boundary via RPC.

**Two-tier allowlist:**

1. **`ALLOWED_PROVIDERS` (hard allowlist)** — a set of provider types that have been analyzed for security implications and are safe to bridge: `patchwork:contact` and `patchwork:selected-doc`. New types require independent security analysis before being added. Any type not in this set is rejected with a console warning.

2. **`shared-providers` attribute (per-instance)** — the `<patchwork-isolation>` element reads a `shared-providers` attribute (comma-separated list of provider types). The effective bridged set is the intersection of this attribute and `ALLOWED_PROVIDERS`. No providers are bridged by default — the host must opt in.

**Analyzed types:**

- **`patchwork:contact`** — returns the user's contact document URL. Leaks minimal information (the user's own contact doc, which is auto-allowlisted as a special case). Used by comments-view and codemirror-base to tag comments with the current user.
- **`patchwork:selected-doc`** — returns the currently selected document URLs. Used by history-view to know which document to show history for. Values are silently filtered to only include URLs already on the document allowlist (no prompting) — the semantic is "which of my allowlisted documents is selected," not "give me access to the selected document."

**All other subscription types are rejected.** Bridging additional providers could leak document URLs or other sensitive information to the isolated context.

**Value filter:** Before relaying values to the iframe, the bridge checks them for automerge URLs. For `patchwork:selected-doc`, non-allowlisted URLs are silently dropped (avoids spurious prompts during navigation when the iframe is about to be torn down and recreated). For other types, unknown URLs trigger a refresh of the allowlist and a user prompt via `window.confirm()` if still unknown.

### Unsafe modal

System tools (account picker, frame configurator, module settings manager) need full access to the host repo and sensitive documents (account doc, module settings) that are denylisted from the iframe. These tools open in a host-side lightbox modal via the `patchwork-unsafe-modal` component, which intercepts `patchwork:open-unsafe-modal` events bubbling up from descendants.

The modal renders a `<patchwork-view>` in the host DOM (outside the isolation boundary) so the tool has full access to the host repo. The sideboard footer buttons dispatch `patchwork:open-unsafe-modal` instead of `patchwork:open-document` for these system tools.

## Pending work

### TODOs

- [ ] **Security audits.** Run this implementation through security review and adversarial testing.
- [ ] make updates below after Automerge API changes and Keyhive land

### Waiting on automerge/keyhive teams

These are API changes being developed by the automerge and keyhive teams. The isolation architecture depends on them but cannot implement them until they ship.

- **Author ID API.** Configure an author ID on the iframe's Repo so that edits made by tools are correctly attributed. The iframe repo will be configured with the isolation identity's author ID. (Not yet available on main.) Once available, improve the unknown-document handling in `onAccessRequest`:
  - When the intermediary encounters an unknown document whose author matches the iframe's assigned author ID, auto-allowlist it (the iframe created it) instead of prompting.
  - For unknown documents with a different author, keep prompting the user.
  - Today, _all_ unknown documents prompt the user (the blanket auto-allowlist workaround has been removed); this change would restore silent access for the iframe's own creations only.
- **"Signed or signable" bridge config.** Configure the bridge connection (NetworkAdapter or similar) between the intermediary repo and the iframe repo to only accept signed or signable commits from the iframe direction. Signable commits are signed with the isolation identity; mis-attributed commits are dropped. (Not yet available.)

### Tracked separately

These are known issues that will be fixed independently. They are no longer open problems for this isolation design.

- **Don't create tool URL vulnerabilities via `suggestedImportUrl`.** The `@patchwork.suggestedImportUrl` field currently syncs raw automerge URLs, potentially leaking document IDs to tools.
- **Isolate datatypes from main thread.** Tool datatypes (like `import`) currently run on the main thread with full privileges.
- **Isolate metadata loading for plugins.** Plugin metadata loading currently uses `import` on the main thread, which runs tool entry modules in the host context.
