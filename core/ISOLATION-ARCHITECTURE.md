# Tool Isolation Architecture

## Threat model

Our chief concern is mischievous or malicious tool authors. We want users to be able to safely run third-party tools in their patchwork.

The attacker is a tool author who publishes a tool that users install. The attacker does not control the Patchwork host application or the sync server. The tool is standard JavaScript — it can do anything JavaScript can do within whatever execution context it's given.

We want to prevent one attack:

1. **Unauthorized data access.** A tool must not access data that wasn't handed to it by the user. This includes documents belonging to other tools — accessing those could allow a malicious tool to damage the user's environment (for example, by modifying another tool's source code).

Data exfiltration (sending data to external servers) is **out of scope**. We assume tools may have legitimate reasons to make network requests and do not attempt to prevent outbound data flow. This significantly simplifies the isolation architecture — many security layers that would otherwise be needed to block outbound data flow are unnecessary.

**Trust boundary.** The Patchwork host application and its built-in code are trusted. Third-party tool code is untrusted. Currently, only the main document view runs in the isolated context. Sidebar and toolbar tools are assumed trusted — isolating them is future work.

**No server enforcement.** Patchwork is local-first. There is no server mediating tool access to documents. All isolation must happen in the browser, using the browser's own security primitives.

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
│  │ │ Allowlist                │   │  │  │   │ Fetch Handler                │ │
│  │ │ - allowlist: root doc,   │   │  │  │   │ (es-module-shims source hook)│ │
│  │ │   transitive, approved   │   │  │  │   │ - resolves module & package  │ │
│  │ │                          │   │  │  │   |   imports via PostMessage    │ │
│  │ └──────────────────────────┘   │  │  │   └──────────────────────────────┘ │
│  │                                │  │  │                                    │
│  │ Signs "signable" commits       │  │  │   ┌──────────────────────────────┐ │
│  │ with isolation identity        │  │  │   │ Package Registry             │ │
│  └───────────────┬────────────────┘  │  │   │ - pre-populated at boot      │ │
│                  │                   │  │   │ - lazy-loads implementations │ │
│  ┌───────────────┴───────────────┐   │  │   │ - push updates from host     │ │
│  │ Keyhive Isolation Identity    │   │  │   └──────────────────────────────┘ │
│  │ - attenuated access           │   │  │                                    │
│  │ - no account/settings/tools   │   │  │                                    │
│  └───────────────────────────────┘   │  │                                    │
└──────────────────┬───────────────────┘  └──────────────────┬─────────────────┘
                   │                                         │
                   │   ┌─────────────────────────────────┐   │
                   │   │       Communication             │   │
                   ├───┤        (MessagePort)            ├───┤
                   │   │  - module & package source      │   │
                   │   │    loading                      │   │
                   │   │  - registry operations          │   │
                   │   │  - navigation/access requests   │   │
                   │   ├─────────────────────────────────┤   │
                   │   │  Automerge Sync (MessagePort)   │   │
                   └───┤  - document data flow           ├───┘
                       │  - "signed or signable" filter  │
                       │  - unsigned in → signed out     │
                       └─────────────────────────────────┘
```

## Components

### Sandboxed iframe (opaque origin)

The primary isolation boundary. Tool code runs inside an `<iframe sandbox="allow-scripts">` without `allow-same-origin`. This gives the iframe an opaque origin — the browser's same-origin policy prevents it from accessing the host's DOM, cookies, localStorage, IndexedDB, or service workers.

**Why this is needed:** Without origin isolation, a tool could read or modify any data accessible to the host page. The opaque-origin sandbox is the strongest isolation primitive browsers provide and is the foundation all other mechanisms build on.

### Isolation element (frame tool)

A host-side custom element that wraps the point where the main document area is loaded, replacing direct rendering with an isolated iframe. It manages the iframe lifecycle, resolves which tool to render, and coordinates all communication channels (RPC, sync, bootstrap).

The isolation element should follow the current providers-based pattern: the component render interface (`(element: HTMLElement) => () => void`) and provider event forwarding via RPC. The current `isolated-patchwork-view` was designed around an older interface and will be reimplemented to match the current architecture.

**Why this is needed:** Something must sit at the boundary between trusted host code and untrusted tool code, setting up the iframe, establishing communication channels, and enforcing access control. The isolation element is that boundary.

### Intermediary Repo & document allowlist

An ephemeral host-side Automerge repo (in-memory, no storage) that sits between the host's main repo and the iframe's repo. It enforces which documents can sync to the iframe using two mechanisms:

- **Allowlist** — documents the tool is permitted to access. Initially contains only the root document URL. Expanded with documents discovered transitively in content (the user opened the parent, so children are considered authorized) and documents explicitly approved by the user via a prompt.

Access is enforced via `shareConfig.access()` on the intermediary repo's network adapter, which gates every document sync request.

**Why this is needed:** The opaque-origin iframe prevents tools from accessing host-side storage, but tools still receive documents via Automerge sync. Without the allowlist/denylist, a tool could call `repo.find()` with any document URL and receive it. The intermediary repo ensures tools only see documents the user has authorized.

### Keyhive integration

Keyhive adds cryptographic identity and access control to the system. Three aspects are relevant to isolation:

**1. Isolation identity.** A separate keyhive identity with attenuated access, used at the intermediary repo instead of the user's primary device identity. This identity has access only to user documents — not the account document, module settings, or tool packages. This strengthens guarantees (even a compromised intermediary repo can't access sensitive documents) and protects the user's device keys from exposure.

**2. No keyhive inside the iframe.** The iframe repo does not use keyhive and receives no keys. This is deliberate: we do not want tools or their authors to be able to delegate access to documents, and since we are not protecting against exfiltration, there is no benefit to signing edits inside the iframe.

**3. Unsigned edits signed at the intermediary.** Tools in the iframe make unsigned edits to documents. These edits flow back to the intermediary repo over the sync connection. The bridge is configured to only accept "signed or signable" commits — it signs signable commits with the isolation identity's author ID and drops anything that is mis-attributed. This ensures all changes that enter the main document graph are properly signed, even though the tool never had keys.

**Why this is needed:** Keyhive requires all changes to be signed before they are accepted into the document graph. Without the unsigned→signed bridge, tool edits would be dropped. The isolation identity adds defense-in-depth by limiting what the intermediary repo itself can access.

### Module loader (fetch handler in iframe)

Tool code is loaded using `es-module-shims` with an async source hook. When the iframe needs to import a module, the source hook sends the URL to the host via capnweb RPC. The host resolves the URL (via its service worker for automerge URLs, or directly for host-origin URLs) and returns the source text to the iframe.

The iframe cannot fetch modules from the host origin directly (opaque origin blocks same-origin requests). All module resolution is mediated by the host.

**Why this is needed:** Tools need to load JavaScript modules to run, but the iframe's opaque origin prevents direct access to the host's module infrastructure. The module fetch handler provides a controlled channel where the host can apply URL rewriting and enforce access policies before serving code to the iframe.

### Package registry in iframe

At boot, the host pre-populates the iframe's plugin registries with metadata for all available plugins. Plugins are registered as lazy-loading entries — their implementations are only fetched (via the module loader) when actually used. The host pushes registry updates to the iframe when plugins change.

**Why this is needed:** Tools use plugin registries to discover and load other tools (e.g., to render embedded content). Without pre-population, the iframe would need direct access to the host's registries. Lazy-loading ensures only the plugins a tool actually uses are loaded into the iframe.

## Pending work

### Design not yet planned

- **Providers in isolation.** How the providers architecture interacts with isolation boundaries — how provider events are forwarded across the iframe boundary and what trust/access model providers require.
- **Security isolation needs for providers.** What access model providers themselves need and how to enforce it within the isolation architecture.

### Waiting on automerge/keyhive teams

These are API changes being developed by the automerge and keyhive teams. The isolation architecture depends on them but cannot implement them until they ship.

- **Author ID API.** Configure an author ID on the iframe's Repo so that edits made by tools are correctly attributed. The iframe repo will be configured with the isolation identity's author ID. (Not yet available on main.)
- **"Signed or signable" bridge config.** Configure the bridge connection (NetworkAdapter or similar) between the intermediary repo and the iframe repo to only accept signed or signable commits from the iframe direction. Signable commits are signed with the isolation identity; mis-attributed commits are dropped. (Not yet available.)

### Tracked separately

These are known issues that will be fixed independently. They are no longer open problems for this isolation design.

- **Don't create tool URL vulnerabilities via `suggestedImportUrl`.** The `@patchwork.suggestedImportUrl` field currently syncs raw automerge URLs, potentially leaking document IDs to tools.
- **Isolate datatypes from main thread.** Tool datatypes (like `import`) currently run on the main thread with full privileges.
- **Isolate metadata loading for plugins.** Plugin metadata loading currently uses `import` on the main thread, which runs tool entry modules in the host context.
