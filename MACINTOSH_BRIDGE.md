# `window.macintosh` — macOS System Bridge for Patchwork

## Branch

`claude/patchwork-ios-capture-tool-oLM3H`

## What Was Done

Added a `window.macintosh` API that exposes macOS system capabilities to Patchwork tools running inside Tauri. This lets tool authors build tools that interact with the host macOS system — processes, Reminders, Calendar, a real PTY shell, and more.

## Architecture

### Rust Side: `src-tauri/src/macintosh.rs`

A single Rust module containing all Tauri commands, grouped by category:

- **Process commands**: `mac_list_processes` (via `ps`), `mac_running_apps` (via JXA/NSWorkspace)
- **Execute**: `mac_execute` — run any command with args, cwd, env; returns stdout/stderr/exit code
- **Reminders** (all via JXA/osascript):
  - `mac_reminders_get_lists`, `mac_reminders_get_items`, `mac_reminders_create`, `mac_reminders_complete`
- **Calendar** (all via JXA/osascript):
  - `mac_calendar_get_calendars`, `mac_calendar_get_events`, `mac_calendar_create_event`
- **Shell/PTY** (via `portable-pty` crate):
  - `mac_shell_spawn` — opens a real PTY, spawns a shell, starts a reader thread that emits `macintosh://shell/{id}/data` Tauri events
  - `mac_shell_write` — write to the PTY
  - `mac_shell_resize` — resize the PTY (for xterm.js integration)
  - `mac_shell_kill` — kill the child process and clean up
- **System**: `mac_system_hostname`, `mac_frontmost_app`
- **Raw scripting**: `mac_run_applescript`, `mac_run_jxa` — for power users who want to run arbitrary automation scripts

**State management**: `ShellState` holds a `HashMap<u64, Arc<ShellSession>>` of active PTY sessions, managed via Tauri's state system.

**JXA pattern**: All Reminders/Calendar/NSWorkspace calls use `osascript -l JavaScript -e '...'`. Parameters are safely interpolated using `serde_json::to_string()` which produces properly escaped JS string literals.

### TypeScript Side: `sites/tiny-patchwork/src/macintosh.ts`

Exports `initMacintosh()` which checks for `__TAURI__` and wires up `window.macintosh` with a clean, ergonomic API. Full TypeScript types are provided for all return values.

The shell API is particularly interesting — `spawn()` returns an object with `write()`, `resize()`, `kill()`, `onData()`, and `onExit()` methods. Data flows via Tauri events, making it compatible with xterm.js's streaming model.

### Integration Points

- `src-tauri/src/lib.rs`: imports `mod macintosh;`, registers `ShellState` via `.manage()`, and adds all 18 commands to `generate_handler![]`
- `src-tauri/Cargo.toml`: added `portable-pty = "0.8"` and `hostname = "0.4"`
- `sites/tiny-patchwork/src/main.ts`: imports and calls `initMacintosh()` after `window.patchwork` is set up

## What Still Needs Work

### Must Do Before Shipping

1. **Compile test on macOS** — The Rust code was written without a macOS compile pass. The `portable-pty` API and `sysinfo` assumptions should be validated. Common issues:
   - `portable-pty` version 0.8 may need `0.8.x` specifically
   - `hostname` crate API — verify `hostname::get()` exists in 0.4

2. **Tauri capability permissions** — The commands are registered but `src-tauri/capabilities/default.json` currently only has `core:default`. Custom app commands should work without explicit ACL entries in Tauri v2, but this should be verified. If commands fail with permission errors, add explicit `"shell:*"` style permissions.

3. **Entitlements for notarization** — For the app to pass macOS notarization with these capabilities:
   - Reminders access requires the `com.apple.security.personal-information.calendars` entitlement (or user-granted permission on modern macOS)
   - Calendar access requires the same
   - Accessibility access (for `frontmostApp`) requires user to grant it in System Preferences > Privacy & Security > Accessibility
   - These are runtime permission prompts on macOS 10.14+, but the app's `Info.plist` or entitlements file may need usage description strings

4. **App Sandbox considerations** — If the app is sandboxed (for Mac App Store), `osascript` and `ps` won't work. For direct distribution with Developer ID signing, these should work fine.

### Nice to Have

5. **Contacts API** — Add JXA-based access to macOS Contacts.app
6. **Notifications** — Could add `mac_send_notification` via NSUserNotification or UNUserNotificationCenter
7. **File system bookmarks** — For accessing files outside the sandbox (if ever sandboxed)
8. **Clipboard** — Could add `mac_clipboard_read`/`mac_clipboard_write` via `NSPasteboard` JXA, though the web Clipboard API already works
9. **Screen capture / window list** — Via CGWindowListCopyWindowInfo
10. **Speech synthesis** — Via `NSSpeechSynthesizer` JXA

### Shell Session Improvements

11. **Environment inheritance** — The shell spawn currently inherits the Tauri process environment. May want to source the user's shell profile (`~/.zshrc`, etc.)
12. **Session cleanup on app quit** — Kill all active PTY sessions when the app exits
13. **Binary data support** — Currently shell data is sent as lossy UTF-8 strings. For full terminal emulation, may need base64-encoded binary events
14. **Shell detection** — Currently defaults to `$SHELL` or `/bin/zsh`. Could be smarter about detecting the user's preferred shell.

## Usage Examples (for tool authors)

```javascript
// Check if available
if (window.macintosh) {

  // List processes
  const procs = await window.macintosh.processes();

  // Run a command
  const result = await window.macintosh.execute("ls", ["-la", "/tmp"]);
  console.log(result.stdout);

  // Get reminders
  const lists = await window.macintosh.reminders.getLists();
  const items = await window.macintosh.reminders.getReminders("Shopping");

  // Create a reminder
  await window.macintosh.reminders.create("Buy milk", { list: "Shopping" });

  // Get calendar events for next week
  const events = await window.macintosh.calendar.getEvents({
    from: new Date().toISOString(),
    to: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  });

  // Spawn a terminal (for use with xterm.js)
  const shell = await window.macintosh.shell.spawn({ rows: 24, cols: 80 });
  shell.onData((data) => terminal.write(data));  // pipe to xterm.js
  terminal.onData((data) => shell.write(data));  // pipe from xterm.js
  shell.onExit(() => console.log("shell exited"));

  // Run arbitrary JXA
  const result = await window.macintosh.jxa(`
    ObjC.import('Cocoa');
    $.NSWorkspace.sharedWorkspace.openURL($.NSURL.URLWithString("https://example.com"));
  `);
}
```

## File Inventory

| File | Purpose |
|------|---------|
| `src-tauri/src/macintosh.rs` | Rust module with all 18 Tauri commands |
| `sites/tiny-patchwork/src/macintosh.ts` | TypeScript bridge, types, and `initMacintosh()` |
| `src-tauri/src/lib.rs` | Modified: imports module, registers state and commands |
| `src-tauri/Cargo.toml` | Modified: added `portable-pty` and `hostname` deps |
| `sites/tiny-patchwork/src/main.ts` | Modified: imports and calls `initMacintosh()` |
