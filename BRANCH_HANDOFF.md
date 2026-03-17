# Branch Handoff: `claude/patchwork-ios-capture-tool-oLM3H`

## TL;DR

This branch turns Patchwork (a malleable collaborative document environment) into a native macOS app using Tauri v2. Starting from a web-only app, the branch adds:

1. A **Tauri shell** wrapping the existing web frontend
2. A **local sync server** (samod) running inside the app for persistence + sync
3. A **content server** so tool modules can be imported from automerge documents via HTTP
4. A **system tray** with native menus for creating documents
5. **Apple Shortcuts** integration (eval JS, create documents, share sheet)
6. A **WidgetKit extension** for pinned document widgets
7. **CI/CD** with GitHub Actions, code signing, and notarization (in progress)
8. **`window.macintosh`** — a JS bridge exposing macOS system APIs (processes, Reminders, Calendar, PTY shell, etc.)

---

## Full Commit History (69 commits from master)

### Phase 1: Early web infrastructure
- Edge functions, service worker fixes, netlify setup, module loading fixes

### Phase 2: Tauri app foundation (`5ab730b3` – `abf9718d`)
- `5ab730b3` **tauri app** — initial Tauri v2 scaffold
- `15adb777` **use samod for local sync server** — embedded Rust sync server using samod (automerge sync protocol). Connects to `wss://sync3.automerge.org` upstream. Stores docs in `~/.cache/automerge`
- `826e7b21` **patchwork:// custom protocol handler** — serves automerge document content as HTTP responses (navigates folder structures, resolves `automerge:docId#heads` URLs, infers MIME types)
- `cd644ba2` – `bb8fba60` **CI setup** — GitHub Actions for macOS builds, cargo-tauri, pnpm build integration
- Various CORS fixes, protocol handler iterations, heads pinning for module cache keys
- `abf9718d` **Replace custom protocol with local HTTP server** — moved content serving from Tauri's custom protocol to an Axum HTTP server on localhost:3030 (more compatible, especially for iOS)

### Phase 3: Native macOS features (`291c9a03` – `ad82c7ac`)
- `291c9a03` **hash bar** — editable URL pills for navigation
- `6bf2fc12` **macOS menubar tray** — system tray with dynamic "New Document" menu items per registered datatype, capture panel window
- `0f646b82` **eval API + Apple Shortcuts** — HTTP POST `/eval` endpoint, Swift App Intents (EvalInPatchwork, CreateDocument, ListDatatypes, ShareToPatchwork), `patchwork-native` package
- `335a2464` – `3490ab9b` fixes: content serving directly from samod, announce policy to not flood browser peers
- `46848715` **keep app alive on last window close** — macOS behavior: hide instead of quit
- `7e598d11` **tray improvements** — user profile/avatar in tray, focus existing windows, `ensure_focused_and_new()` helper
- `f54150f0` **settings window** — standalone HTML page for capture tool ID + global shortcut key recording
- `e609b4ea` **auto-add docs to root folder** on creation
- `ad82c7ac` **WidgetKit extension** — Swift WidgetKit for pinned document widgets

### Phase 4: CI, signing, notarization (`2e16343b` – `3d40a346`)
- `2e16343b` Apple certificate code signing in CI
- `ffc67f25` – `3977b0aa` Fix menu items, add notarization with `apple-api-key`
- `3d40a346` Switch to App Store Connect API key for notarization
- **Status**: Notarization is currently failing because the certificate is a "Distribution" cert instead of a "Developer ID Application" cert. The fix is to generate the correct certificate type (see discussion in chat).

### Phase 5: `window.macintosh` bridge (`acc502c2` – `8cc6f632`)
- `acc502c2` **Add window.macintosh bridge** — Rust module + TypeScript bridge exposing macOS system APIs
- `8cc6f632` **Handoff doc** for the macintosh bridge specifically

---

## Current State of the App

### Architecture

```
┌─────────────────────────────────────────────┐
│  Tauri v2 App                               │
│  ┌───────────────────────────────────────┐  │
│  │  Frontend (Vite + TS)                 │  │
│  │  - patchwork-elements (web components)│  │
│  │  - patchwork-plugins (tool registry)  │  │
│  │  - patchwork-filesystem (module watch)│  │
│  │  - window.patchwork (repo, modules)   │  │
│  │  - window.macintosh (system APIs)     │  │
│  └───────────────────┬───────────────────┘  │
│                      │ IPC                   │
│  ┌───────────────────┴───────────────────┐  │
│  │  Rust Backend (lib.rs + macintosh.rs) │  │
│  │  - Tray menu management              │  │
│  │  - Settings persistence              │  │
│  │  - Global shortcut registration      │  │
│  │  - Eval bridge (for Shortcuts)       │  │
│  │  - macOS system API commands         │  │
│  │  - PTY shell session management      │  │
│  └───────────────────┬───────────────────┘  │
│                      │                       │
│  ┌───────────────────┴───────────────────┐  │
│  │  Axum HTTP/WS Server (localhost:3030) │  │
│  │  - POST / → WebSocket sync (samod)   │  │
│  │  - POST /eval → JS eval endpoint     │  │
│  │  - GET / → Content from automerge    │  │
│  └───────────────────┬───────────────────┘  │
│                      │                       │
│  ┌───────────────────┴───────────────────┐  │
│  │  samod (automerge sync)               │  │
│  │  - TokioFilesystemStorage            │  │
│  │  - Upstream: sync3.automerge.org      │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  Swift Extensions:                           │
│  - PatchworkIntents (Siri Shortcuts)         │
│  - PatchworkWidget (WidgetKit)               │
└──────────────────────────────────────────────┘
```

### Key Files

| File | What it does |
|------|-------------|
| `src-tauri/src/lib.rs` | Main Tauri app (~1000 lines): window mgmt, tray, settings, eval bridge, sync server, content serving |
| `src-tauri/src/macintosh.rs` | macOS system API commands: processes, execute, reminders, calendar, PTY shell, JXA |
| `src-tauri/Cargo.toml` | Deps: tauri v2, samod, automerge, axum, portable-pty, etc. |
| `src-tauri/tauri.conf.json` | App config: `withGlobalTauri: true`, no CSP, dynamic windows |
| `src-tauri/capabilities/default.json` | Permissions for main-*, capture-panel, settings windows |
| `src-tauri/swift-plugins/PatchworkIntents/` | Apple Shortcuts: eval, create doc, list datatypes, share |
| `src-tauri/swift-plugins/PatchworkWidget/` | WidgetKit extension (placeholder) |
| `sites/tiny-patchwork/src/main.ts` | Frontend entry: repo setup, tray sync, eval handler, macintosh init |
| `sites/tiny-patchwork/src/macintosh.ts` | `window.macintosh` TypeScript bridge with full types |
| `sites/tiny-patchwork/src/settings.ts` | Settings window: capture tool ID, shortcut key recording |
| `.github/workflows/build-macos.yml` | CI: build, sign, notarize (needs Developer ID cert fix) |

### What Works
- Tauri app builds and runs
- samod sync server with upstream cloud sync
- Content serving from automerge documents
- System tray with dynamic document creation
- Settings persistence
- Global keyboard shortcuts
- Apple Shortcuts integration via Swift
- `window.macintosh` API is wired up (needs compile test on macOS)

### What's Broken / In Progress
1. **Notarization** — needs a "Developer ID Application" certificate instead of the current "Distribution" certificate. Both notarization errors ("not signed with valid Developer ID" and "no secure timestamp") will be fixed by using the correct cert type.
2. **`window.macintosh` compile test** — the Rust code was written without a macOS compile pass. `portable-pty` and `hostname` crate APIs should be verified.
3. **Entitlements** — Reminders/Calendar access may need entitlements or `Info.plist` usage descriptions for the runtime permission prompts.

---

## Chat Context / Decisions Made

### Notarization Discussion
The user hit a notarization failure. The root cause: they uploaded a **Distribution Certificate** (for Mac App Store) but notarization requires a **Developer ID Application** certificate (for direct distribution outside the App Store). Three cert types exist for macOS:
- **Apple Distribution** → Mac App Store only, no notarization
- **Developer ID Application** → direct distribution, **required for notarization**
- **Developer ID Installer** → for `.pkg` installers

The fix: generate a new "Developer ID Application" cert from developer.apple.com, export as .p12, base64 encode, and update the `APPLE_CERTIFICATE_BASE64` GitHub secret.

### `window.macintosh` Design Decisions
The user wanted Patchwork tools to be able to:
- Detect if running inside Tauri
- Access macOS system stuff: processes, Reminders, Calendar
- Launch processes and use xterm-pty for terminal access
- Access as much of the system as possible (with Accessibility access granted)

Design choices made:
- **JXA via osascript** for Reminders/Calendar/NSWorkspace — simplest path from Rust, no complex Obj-C bridging needed
- **`portable-pty`** for real PTY support — needed for xterm.js compatibility (terminal escape sequences, window resizing)
- **`ps` command** for process listing — avoids sysinfo crate version headaches
- **Tauri events** for PTY data streaming — `macintosh://shell/{id}/data` events flow from a reader thread to the frontend
- **`window.macintosh`** as the global — all APIs namespaced under one clean object
- **Raw `applescript()` and `jxa()`** methods — escape hatch for power users to do anything
- Parameters safely interpolated into JXA via `serde_json::to_string()` (produces valid JS string literals)

---

## For the Next LLM

### If you need to fix compilation
The `macintosh.rs` module was written targeting `portable-pty = "0.8"` and `hostname = "0.4"`. If APIs don't match:
- `portable-pty`: check `PtySystem::openpty()`, `MasterPty::try_clone_reader/writer()`, `SlavePty::spawn_command()`
- `hostname`: check if `hostname::get()` returns `Result<OsString, _>`

### If you need to fix notarization
1. User generates "Developer ID Application" cert from developer.apple.com
2. Exports as .p12, base64 encodes
3. Updates `APPLE_CERTIFICATE_BASE64` secret
4. May also need `APPLE_SIGNING_IDENTITY` set to the cert's common name

### If you need to add more macOS APIs
Follow the pattern in `macintosh.rs`:
1. Write a JXA script string (use `jxa_str()` for safe parameter interpolation)
2. Call `run_jxa(&script)` and parse the JSON result
3. Add a `#[tauri::command]` function
4. Register it in `lib.rs`'s `generate_handler![]`
5. Add the TypeScript wrapper in `macintosh.ts`

### If you need to add entitlements
The app needs entitlements for:
- `com.apple.security.personal-information.calendars` (Reminders + Calendar)
- Accessibility access is granted by the user in System Preferences (no entitlement needed)
- These go in a `.entitlements` plist file referenced by the Tauri build config
