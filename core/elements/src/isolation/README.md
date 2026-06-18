# Tool Isolation Architecture

## Threat model

Our chief concern is mischievous or malicious tool authors. We want users to be able to safely run third-party tools in their patchwork.

The attacker is a tool author who publishes a tool that users install. The attacker does not control the Patchwork host application or the sync server. The tool is standard JavaScript — it can do anything JavaScript can do within whatever execution context it's given.

We want to prevent one attack:

1. **Unauthorized data access.** A tool must not access data that wasn't handed to it by the user. This includes documents belonging to other tools — accessing those could allow a malicious tool to damage the user's environment (for example, by modifying another tool's source code).

**Trust boundary.** The Patchwork host application and its built-in code are trusted. Third-party tool code is untrusted. Currently, only the main document view runs in the isolated context. Sidebar and toolbar tools are assumed trusted — isolating them is future work.

**No server enforcement.** Patchwork is local-first. There is no server mediating tool access to documents. All isolation must happen in the browser, using the browser's own security primitives.

## Out of scope

- preventing data exfiltration (sending data to external servers).
- supporting patchwork `providers` requests across the isolation boundary.
- granular capability-based or tool-specific access control. In this architecture, we are aiming for a simple implementation that can handle a small number of critical guarantees with minimal disruption to the existing system.

## Architecture overview

```
 HOST (trusted)                           IFRAME (untrusted, opaque origin)
┌──────────────────────────────────────┐  ┌────────────────────────────────────┐
│                                      │  │                                    │
│  Isolation Element (frame tool)      │  │   Tool Code                        │
│  ┌────────────────────────────────┐  │  │                                    │
│  │ Wraps main document area,      │  │  │   ┌──────────────────────────────┐ │
│  │ manages iframe lifecycle       │  │  │   │ In-memory Repo               │ │
│  └────────────────────────────────┘  │  │   │ (no keyhive, no storage)     │ │
│                                      │  │   │ - author ID configured       │ │
│  ┌────────────────────────────────┐  │  │   │ - unsigned edits only        │ │
│  │ Intermediary Repo (ephemeral)  │  │  │   └──────────┬───────────────────┘ │
│  │                                │  │  │              │                     │
│  │ ┌──────────────────────────┐   │  │  │   ┌──────────┴───────────────────┐ │
│  │ │ Allowlist                │   │  │  │   │ Module Loader                │ │
│  │ │ - root doc + transitive  │   │  │  │   │ (es-module-shims source hook)│ │
│  │ │ - auto-allow unknown *   │   │  │  │   │ - all imports via RPC        │ │
│  │ │ - user-approved          │   │  │  │   │ - sees pkg: URLs only        │ │
│  │ ├──────────────────────────┤   │  │  │   └──────────────────────────────┘ │
│  │ │ Denylist                 │   │  │  │                                    │
│  │ │ - account doc            │   │  │  │   ┌──────────────────────────────┐ │
│  │ │ - module settings        │   │  │  │   │ Fetch Proxy                  │ │
│  │ │ - tool source code       │   │  │  │   │ - host-origin fetch() → RPC  │ │
│  │ │ - plugin import URLs     │   │  │  │   │ - <link> interception        │ │
│  │ │ (takes precedence)       │   │  │  │   └──────────────────────────────┘ │
│  │ └──────────────────────────┘   │  │  │                                    │
│  │                                │  │  │   ┌──────────────────────────────┐ │
│  │ Signs "signable" commits       │  │  │   │ Package Registry             │ │
│  │ with isolation identity        │  │  │   │ - pre-populated (pkg: URLs)  │ │
│  └───────────────┬────────────────┘  │  │   │ - lazy-loads implementations │ │
│                  │                   │  │   │ - push updates from host     │ │
│  ┌───────────────┴───────────────┐   │  │   └──────────────────────────────┘ │
│  │ Keyhive Isolation Identity    │   │  │                                    │
│  │ - attenuated access           │   │  │                                    │
│  │ - no account/settings/plugins │   │  │                                    │
│  └───────────────────────────────┘   │  │                                    │
│                                      │  │                                    │
│  ┌────────────────────────────────┐  │  │                                    │
│  │ Plugins RPC Handler            │  │  │                                    │
│  │ - fetch-package: pkg: → real   │  │  │                                    │
│  │   automerge URL, return src    │  │  │                                    │
│  │ - fetch-resource: resolve &    │  │  │                                    │
│  │   return host-origin assets    │  │  │                                    │
│  │ - PluginsUrlMapper (pkg: ↔     │  │  │                                    │
│  │   automerge bidirectional)     │  │  │                                    │
│  └────────────────────────────────┘  │  │                                    │
└──────────────────┬───────────────────┘  └──────────────────┬─────────────────┘
                   │                                         │
                   │   ┌─────────────────────────────────┐   │
                   │   │       RPC (MessagePort)         │   │
                   ├───┤  - fetch-package (module src)   ├───┤
                   │   │  - fetch-resource (assets)      │   │
                   │   │  - registry operations          │   │
                   │   │  - navigation/access requests   │   │
                   │   ├─────────────────────────────────┤   │
                   │   │  Automerge Sync (MessagePort)   │   │
                   └───┤  - document data flow           ├───┘
                       │  - allowlist/denylist enforced  │
                       │  - "signed or signable" filter  │
                       │  - unsigned in → signed out     │
                       └─────────────────────────────────┘

* auto-allow unknown: documents not in the host repo are auto-allowlisted
  without prompting — see "Security consideration" in Allowlist section.
```

## Security considerations

**A key security invariant is controlling which automerge URLs or document IDs the isolated context is able to learn about.**

With this design, Keyhive provides three main guarantees:

- Tools will not be able to exfiltrate document access, since no keys cross the boundary and the tool cannot delegate access. They can still exfiltrate document data, and they can still access/edit allowlisted documents while they are running in Patchwork.
- Keyhive protects a small and critical set of documents (account doc, module settings, plugin source code) from ever being accessed by the tool.
- If the isolation identity behaves badly, access can be revoked without the user losing their entire device identity. However, we don't currently have anything in place to trace the source of bad edits to particular tools effectively.

Because we use a shared Keyhive isolation identity for all isolated contexts, the isolation identity has access to all user documents which are outside of the critical protected set. These documents are vulnerable if a user doesn't want particular tools to access them. (The protected set could be expanded and user-specific, but there will likely be cases where a user wants only a subset of their tools to have access.)

Given the transitive allowlist population which we use for the sake of reasonable UX, it should be assumed that once a tool discovers an automerge URL, it will be able to access and modify that document (because it could write it into an allowed document and then get access on a future load). These documents can be best protected by preventing the tool from learning their URLs. (Though as a final fallback, the isolation identity can be revoked.)

Each component described below should be evaluated in terms of whether it leaks document IDs to the iframe or provides a channel through which the iframe could discover them.

## Components

### Sandboxed iframe (opaque origin)

The primary isolation boundary. Tool code runs inside an `<iframe sandbox="allow-scripts">` without `allow-same-origin`. This gives the iframe an opaque origin — the browser's same-origin policy prevents it from accessing the host's DOM, cookies, localStorage, IndexedDB, or service workers.

**Why this is needed:** Without origin isolation, a tool could read or modify any data accessible to the host page. The opaque-origin sandbox is the strongest isolation primitive browsers provide and is the foundation all other mechanisms build on.

### Isolation element (frame tool)

A host-side custom element that wraps the point where the main document area is loaded, replacing direct rendering with an isolated iframe. It manages the iframe lifecycle, resolves which tool to render, and coordinates all communication channels (RPC, sync, bootstrap).

**Why this is needed:** Something must sit at the boundary between trusted host code and untrusted tool code, setting up the iframe, establishing communication channels, and enforcing access control. The isolation element is that boundary.

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

The allowlist starts with only the root document URL and is expanded through three mechanisms:

1. **Transitive discovery.** The root document's content is scanned for embedded automerge URLs (recursively walking objects, arrays, and strings). All discovered URLs are added to the allowlist (unless denylisted). This reflects the assumption that if the user opened a document, its referenced children are authorized for the tool rendering it.

2. **Auto-allowlisting of unknown documents.** When the iframe requests a document that is not in the host repo's handles (i.e., the host has never seen it), it is automatically allowlisted without prompting the user. This covers documents newly created by the iframe, URLs added by a collaborator, or content embedded in the tool. _(TODO: ideally document creation should be proxied to the host so we can track which documents the iframe created, removing the need for this default-allow behavior.)_

3. **User approval.** If a requested document exists in the host repo but is not on the allowlist, the allowlist is first refreshed (re-scanning the root document for new URLs). If the document is still not allowlisted, the user is prompted via `window.confirm()` and can approve access explicitly.

### Keyhive integration

Keyhive adds cryptographic identity and access control to the system. Three aspects are relevant to isolation:

**1. Isolation identity.** A separate keyhive identity with attenuated access, used at the intermediary repo instead of the user's primary device identity. This identity has access only to user documents — not the account document, module settings, or tool packages. This strengthens guarantees (even a compromised intermediary repo can't access sensitive documents) and protects the user's device keys from exposure.

**2. No keyhive inside the iframe.** The iframe repo does not use keyhive and receives no keys. This is deliberate: we do not want tools or their authors to be able to delegate access to documents, and since we are not protecting against exfiltration, there is no benefit to signing edits inside the iframe.

**3. Unsigned edits signed at the intermediary.** Tools in the iframe make unsigned edits to documents. These edits flow back to the intermediary repo over the sync connection. The bridge is configured to only accept "signed or signable" commits — it signs signable commits with the isolation identity's author ID and drops anything that is mis-attributed. This ensures all changes that enter the main document graph are properly signed, even though the tool never had keys.

**Why this is needed:** Keyhive requires all changes to be signed before they are accepted into the document graph. Without the unsigned→signed bridge, tool edits would be dropped. The isolation identity adds defense-in-depth by limiting what the intermediary repo itself can access.

### Module loader & host-mediated fetch proxy

The iframe's opaque origin prevents it from making same-origin requests to the host — the browser blocks these by default. However, tools need to load JavaScript modules and static resources (CSS, images, etc.) to function. To make this possible, the isolation system introduces two proxy channels that selectively bridge the gap:

1. **Module imports** (`fetch-package` RPC) — every ES module import goes through the `es-module-shims` source hook, which sends the URL to the host. The host resolves `pkg:` URLs back to real automerge paths via the `PluginsUrlMapper`, resolves bare automerge URLs to package entry points, and passes through other URLs. The source text and resolved URL are returned to the iframe.

2. **Resource fetches** (`fetch-resource` RPC) — the iframe installs a `fetch()` override that intercepts all requests to host-origin URLs and forwards them to the host via RPC. The host resolves the URL and returns the response body and content type. Non-host-origin fetches pass through to the browser's native `fetch`.

Additionally, `<link rel="stylesheet">` elements added to the DOM are intercepted by a MutationObserver — since native `<link>` elements make direct browser requests that bypass the `fetch()` override, they are replaced with `<style>` tags whose content is fetched through the proxy.

**Security consideration:** These proxies re-open a channel that the opaque origin otherwise closes. Bundled non-automerge assets (host-origin JS, CSS, images, etc.) are not sensitive — they are the same for all users and do not contain user data, so serving them freely is fine. However, requests that resolve to automerge document URLs are sensitive: a tool could construct URLs that reach the service worker and load arbitrary automerge documents as source text. The host-side proxy should filter automerge-backed requests to ensure only documents known to the `pkg:` registry managed by the isolation boundary are served — this filtering is not yet implemented.

### `pkg:` URL scheme

Tool code inside the iframe never sees real automerge document IDs for plugin source code. Instead, plugin import URLs are rewritten to use an opaque `pkg:` scheme before being sent to the iframe. For example, a plugin's automerge URL like `automerge:3Dz.../dist/index.js` becomes `pkg:@patchwork--codemirror-base/dist/index.js`.

The `PluginsUrlMapper` maintains a bidirectional mapping between automerge URL segments and package names. When the iframe requests a `pkg:` URL via the module loader, the host converts it back to the real automerge URL, fetches the source, and returns it.

This serves two purposes:

1. **Prevents document ID leakage.** Automerge URLs are valid document identifiers — if a tool learned them, it could attempt to request those documents via `repo.find()` on the Automerge sync channel, bypassing the fetch proxy entirely. The `pkg:` scheme hides these IDs so that tools cannot learn plugin document IDs in the first place.
2. **Provides hierarchical URLs.** Package-style URLs (`pkg:@scope--name/path`) support relative import resolution, which bare automerge URLs do not.

Heads hashes (used for pinning to specific document versions) are preserved by encoding them as a URL-encoded fragment in the package URL (e.g., `pkg:@patchwork--folder%23headsHash`).

### Package registry in iframe

At boot, the host pre-populates the iframe's plugin registries with metadata for all available plugins (with import URLs already rewritten to `pkg:` URLs). Plugins are registered as lazy-loading entries — their implementations are only fetched (via the module loader) when actually used. The host watches registries for new registrations and pushes updates to the iframe with mapped URLs.

**Why this is needed:** Tools use plugin registries to discover and load other tools (e.g., to render embedded content). Without pre-population, the iframe would need direct access to the host's registries. Lazy-loading ensures only the plugins a tool actually uses are loaded into the iframe.

## Pending work

### TODOs

- [x] **Isolate multiple sister components together.** `patchwork-isolation` now recursively serializes its child element tree and reconstructs it inside the iframe. The allowlist is seeded from all `doc-url` attributes found anywhere in the tree. The host explicitly places providers (e.g. `<patchwork-view component="patchwork-comments-provider">`) as children of `<patchwork-isolation>` — the isolation element doesn't need to know about providers; it just serializes whatever DOM tree it's given. Remaining sub-items:
  - [ ] **Branches denylist conflict.** `checkAndDenylistIfSensitive` denylists all `BranchesDoc` types, which blocks user-document branches needed by the history tool. Need to distinguish tool-code branches from user-document branches.
  - [ ] **Account provider / contact URL in iframe.** The `AccountProvider` needs the account doc URL (denylisted). Tools inside the iframe that need the user's contact URL won't get it.
- [ ] **Filter automerge-backed requests in the fetch proxy.** The host-side RPC handler for `fetch-package` and `fetch-resource` currently resolves and returns whatever the iframe requests without filtering. Bundled non-automerge assets are not sensitive, but requests that resolve to automerge document URLs should be filtered to ensure only documents known to the `pkg:` registry managed by the isolation boundary are served.
- [ ] **Distinguish iframe-created documents from unknown documents.** Currently, any document not in the host repo's handles is auto-allowlisted without prompting. This is because tools create new documents (e.g., for embedded content), those documents need to sync back, and we do not want to prompt for new documents the user implicitly approved. But it also means a tool could request a document ID that exists on the network but not locally, and it would be silently allowed. One possible fix is to proxy document creation through the host so the host can track which documents the iframe created, and then only auto-allow those — prompting for all other unknown documents.
- [ ] **Security audits + throw an LLM at it.** I haven't had a chance to run this implementation through the gauntlet(s) yet. I'll do this after the TODOs above have been addressed.

### Waiting on automerge/keyhive teams

These are API changes being developed by the automerge and keyhive teams. The isolation architecture depends on them but cannot implement them until they ship.

- **Author ID API.** Configure an author ID on the iframe's Repo so that edits made by tools are correctly attributed. The iframe repo will be configured with the isolation identity's author ID. (Not yet available on main.)
- **"Signed or signable" bridge config.** Configure the bridge connection (NetworkAdapter or similar) between the intermediary repo and the iframe repo to only accept signed or signable commits from the iframe direction. Signable commits are signed with the isolation identity; mis-attributed commits are dropped. (Not yet available.)

### Tracked separately

These are known issues that will be fixed independently. They are no longer open problems for this isolation design.

- **Don't create tool URL vulnerabilities via `suggestedImportUrl`.** The `@patchwork.suggestedImportUrl` field currently syncs raw automerge URLs, potentially leaking document IDs to tools.
- **Isolate datatypes from main thread.** Tool datatypes (like `import`) currently run on the main thread with full privileges.
- **Isolate metadata loading for plugins.** Plugin metadata loading currently uses `import` on the main thread, which runs tool entry modules in the host context.
