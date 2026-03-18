use serde::Serialize;
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use tauri::Emitter;
use tokio::sync::Mutex as AsyncMutex;

// ─── State ───────────────────────────────────────────────────────────────────

pub struct ShellState {
    pub sessions: AsyncMutex<HashMap<u64, Arc<ShellSession>>>,
    pub counter: AtomicU64,
}

pub struct ShellSession {
    writer: Mutex<Box<dyn Write + Send>>,
    master: Mutex<Box<dyn portable_pty::MasterPty + Send>>,
    child: Mutex<Box<dyn portable_pty::Child + Send + Sync>>,
}

impl ShellState {
    pub fn new() -> Self {
        Self {
            sessions: AsyncMutex::new(HashMap::new()),
            counter: AtomicU64::new(0),
        }
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/// Run a JXA (JavaScript for Automation) script via osascript and return stdout.
fn run_jxa(script: &str) -> Result<String, String> {
    let output = std::process::Command::new("osascript")
        .args(["-l", "JavaScript", "-e", script])
        .output()
        .map_err(|e| format!("osascript failed to start: {e}"))?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(if stderr.is_empty() {
            format!("osascript exited with {}", output.status)
        } else {
            stderr
        })
    }
}

/// JSON-encode a string for safe interpolation into a JXA script.
/// Returns a quoted, escaped JS string literal like `"hello \"world\""`.
fn jxa_str(s: &str) -> String {
    serde_json::to_string(s).unwrap_or_else(|_| "\"\"".to_string())
}

// ─── Process Commands ────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct ProcessInfo {
    pid: u32,
    name: String,
    memory: u64,
    cmd: Vec<String>,
}

/// List all running processes via `ps`.
#[tauri::command]
pub fn mac_list_processes() -> Result<Vec<ProcessInfo>, String> {
    let output = std::process::Command::new("ps")
        .args(["-eo", "pid,rss,comm"])
        .output()
        .map_err(|e| format!("ps failed: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut processes = Vec::new();

    for line in stdout.lines().skip(1) {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let mut iter = trimmed.split_whitespace();
        let pid: u32 = match iter.next().and_then(|s| s.parse().ok()) {
            Some(v) => v,
            None => continue,
        };
        let rss: u64 = match iter.next().and_then(|s| s.parse().ok()) {
            Some(v) => v,
            None => continue,
        };
        let comm: String = iter.collect::<Vec<_>>().join(" ");
        if comm.is_empty() {
            continue;
        }
        processes.push(ProcessInfo {
            pid,
            name: comm
                .rsplit('/')
                .next()
                .unwrap_or(&comm)
                .to_string(),
            memory: rss * 1024, // ps reports RSS in KB
            cmd: vec![comm],
        });
    }

    processes.sort_by(|a, b| b.memory.cmp(&a.memory));
    Ok(processes)
}

/// List running GUI applications via NSWorkspace.
#[tauri::command]
pub fn mac_running_apps() -> Result<serde_json::Value, String> {
    let script = r#"
        ObjC.import('Cocoa');
        var apps = $.NSWorkspace.sharedWorkspace.runningApplications;
        var result = [];
        for (var i = 0; i < apps.count; i++) {
            var app = apps.objectAtIndex(i);
            var name = app.localizedName;
            result.push({
                name: name ? ObjC.unwrap(name) : '',
                bundleId: app.bundleIdentifier ? ObjC.unwrap(app.bundleIdentifier) : null,
                pid: Number(app.processIdentifier),
                active: Boolean(app.isActive),
            });
        }
        JSON.stringify(result);
    "#;
    let result = run_jxa(script)?;
    serde_json::from_str(&result).map_err(|e| format!("parse error: {e}"))
}

// ─── Execute Commands ────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct ExecResult {
    stdout: String,
    stderr: String,
    code: i32,
}

/// Execute a command and return its stdout, stderr, and exit code.
#[tauri::command]
pub fn mac_execute(
    command: String,
    args: Option<Vec<String>>,
    cwd: Option<String>,
    env: Option<HashMap<String, String>>,
) -> Result<ExecResult, String> {
    let mut cmd = std::process::Command::new(&command);
    if let Some(ref args) = args {
        cmd.args(args);
    }
    if let Some(ref cwd) = cwd {
        cmd.current_dir(cwd);
    }
    if let Some(ref env) = env {
        cmd.envs(env);
    }
    let output = cmd.output().map_err(|e| format!("failed to execute '{}': {e}", command))?;
    Ok(ExecResult {
        stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        code: output.status.code().unwrap_or(-1),
    })
}

// ─── Reminders Commands ──────────────────────────────────────────────────────

/// Get all Reminders lists.
#[tauri::command]
pub fn mac_reminders_get_lists() -> Result<serde_json::Value, String> {
    let script = r#"
        var app = Application("Reminders");
        var lists = app.lists();
        JSON.stringify(lists.map(function(l) {
            return { id: l.id(), name: l.name() };
        }));
    "#;
    let result = run_jxa(script)?;
    serde_json::from_str(&result).map_err(|e| format!("parse error: {e}"))
}

/// Get reminders from a specific list, or all reminders.
#[tauri::command]
pub fn mac_reminders_get_items(list_name: Option<String>) -> Result<serde_json::Value, String> {
    let script = match list_name {
        Some(ref name) => format!(
            r#"
            var app = Application("Reminders");
            var list = app.lists.byName({name});
            var items = list.reminders();
            JSON.stringify(items.map(function(r) {{
                return {{
                    name: r.name(),
                    completed: r.completed(),
                    dueDate: r.dueDate() ? r.dueDate().toISOString() : null,
                    body: r.body() || null
                }};
            }}));
            "#,
            name = jxa_str(name)
        ),
        None => r#"
            var app = Application("Reminders");
            var lists = app.lists();
            var all = [];
            for (var i = 0; i < lists.length; i++) {
                var items = lists[i].reminders();
                for (var j = 0; j < items.length; j++) {
                    var r = items[j];
                    all.push({
                        name: r.name(),
                        completed: r.completed(),
                        dueDate: r.dueDate() ? r.dueDate().toISOString() : null,
                        body: r.body() || null,
                        list: lists[i].name()
                    });
                }
            }
            JSON.stringify(all);
        "#
        .to_string(),
    };
    let result = run_jxa(&script)?;
    serde_json::from_str(&result).map_err(|e| format!("parse error: {e}"))
}

/// Create a new reminder.
#[tauri::command]
pub fn mac_reminders_create(
    title: String,
    list_name: Option<String>,
    notes: Option<String>,
    due_date: Option<String>,
) -> Result<String, String> {
    let list_expr = match list_name {
        Some(ref name) => format!("app.lists.byName({})", jxa_str(name)),
        None => "app.defaultList()".to_string(),
    };
    let props = {
        let mut parts = vec![format!("name: {}", jxa_str(&title))];
        if let Some(ref notes) = notes {
            parts.push(format!("body: {}", jxa_str(notes)));
        }
        if let Some(ref due) = due_date {
            parts.push(format!("dueDate: new Date({})", jxa_str(due)));
        }
        parts.join(", ")
    };
    let script = format!(
        r#"
        var app = Application("Reminders");
        var list = {list_expr};
        var r = app.Reminder({{ {props} }});
        list.reminders.push(r);
        r.id();
        "#
    );
    run_jxa(&script)
}

/// Complete (check off) a reminder by title.
#[tauri::command]
pub fn mac_reminders_complete(title: String, list_name: Option<String>) -> Result<(), String> {
    let list_expr = match list_name {
        Some(ref name) => format!("app.lists.byName({})", jxa_str(name)),
        None => "app.defaultList()".to_string(),
    };
    let script = format!(
        r#"
        var app = Application("Reminders");
        var list = {list_expr};
        var items = list.reminders.whose({{ name: {{ _equals: {} }} }})();
        if (items.length > 0) {{
            items[0].completed = true;
        }} else {{
            throw new Error("Reminder not found");
        }}
        "#,
        jxa_str(&title)
    );
    run_jxa(&script)?;
    Ok(())
}

// ─── Calendar Commands ───────────────────────────────────────────────────────

/// Get all calendars.
#[tauri::command]
pub fn mac_calendar_get_calendars() -> Result<serde_json::Value, String> {
    let script = r#"
        var app = Application("Calendar");
        var cals = app.calendars();
        JSON.stringify(cals.map(function(c) {
            return { uid: c.uid(), name: c.name(), writable: c.writable() };
        }));
    "#;
    let result = run_jxa(script)?;
    serde_json::from_str(&result).map_err(|e| format!("parse error: {e}"))
}

/// Get calendar events within a date range.
#[tauri::command]
pub fn mac_calendar_get_events(
    calendar_name: Option<String>,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<serde_json::Value, String> {
    // Default to today ± 7 days if no range specified
    let from_expr = match from_date {
        Some(ref d) => format!("new Date({})", jxa_str(d)),
        None => "new Date(Date.now() - 7*24*60*60*1000)".to_string(),
    };
    let to_expr = match to_date {
        Some(ref d) => format!("new Date({})", jxa_str(d)),
        None => "new Date(Date.now() + 7*24*60*60*1000)".to_string(),
    };
    let cal_expr = match calendar_name {
        Some(ref name) => format!(
            "app.calendars.whose({{ name: {{ _equals: {} }} }})()",
            jxa_str(name)
        ),
        None => "app.calendars()".to_string(),
    };
    let script = format!(
        r#"
        var app = Application("Calendar");
        var cals = {cal_expr};
        var from = {from_expr};
        var to = {to_expr};
        var result = [];
        for (var i = 0; i < cals.length; i++) {{
            var events = cals[i].events.whose({{
                _and: [
                    {{ startDate: {{ _greaterThan: from }} }},
                    {{ endDate: {{ _lessThan: to }} }}
                ]
            }})();
            for (var j = 0; j < events.length; j++) {{
                var e = events[j];
                result.push({{
                    uid: e.uid(),
                    title: e.summary(),
                    startDate: e.startDate().toISOString(),
                    endDate: e.endDate().toISOString(),
                    location: e.location() || null,
                    notes: e.description() || null,
                    calendar: cals[i].name()
                }});
            }}
        }}
        JSON.stringify(result);
        "#
    );
    let result = run_jxa(&script)?;
    serde_json::from_str(&result).map_err(|e| format!("parse error: {e}"))
}

/// Create a new calendar event.
#[tauri::command]
pub fn mac_calendar_create_event(
    title: String,
    start_date: String,
    end_date: String,
    calendar_name: Option<String>,
    location: Option<String>,
    notes: Option<String>,
) -> Result<String, String> {
    let cal_expr = match calendar_name {
        Some(ref name) => format!(
            "app.calendars.whose({{ name: {{ _equals: {} }} }})()[0]",
            jxa_str(name)
        ),
        None => "app.calendars()[0]".to_string(),
    };
    let mut props = vec![
        format!("summary: {}", jxa_str(&title)),
        format!("startDate: new Date({})", jxa_str(&start_date)),
        format!("endDate: new Date({})", jxa_str(&end_date)),
    ];
    if let Some(ref loc) = location {
        props.push(format!("location: {}", jxa_str(loc)));
    }
    if let Some(ref n) = notes {
        props.push(format!("description: {}", jxa_str(n)));
    }
    let script = format!(
        r#"
        var app = Application("Calendar");
        var cal = {cal_expr};
        var e = app.Event({{ {} }});
        cal.events.push(e);
        e.uid();
        "#,
        props.join(", ")
    );
    run_jxa(&script)
}

// ─── Shell (PTY) Commands ────────────────────────────────────────────────────

/// Spawn a new PTY shell session. Returns the session ID.
/// Data from the PTY is streamed via `macintosh://shell/{id}/data` events.
/// When the process exits, a `macintosh://shell/{id}/exit` event is emitted.
#[tauri::command]
pub async fn mac_shell_spawn(
    app: tauri::AppHandle,
    state: tauri::State<'_, Arc<ShellState>>,
    command: Option<String>,
    args: Option<Vec<String>>,
    cwd: Option<String>,
    rows: Option<u16>,
    cols: Option<u16>,
    env: Option<HashMap<String, String>>,
) -> Result<u64, String> {
    use portable_pty::{native_pty_system, CommandBuilder, PtySize};

    let pty_system = native_pty_system();
    let size = PtySize {
        rows: rows.unwrap_or(24),
        cols: cols.unwrap_or(80),
        pixel_width: 0,
        pixel_height: 0,
    };

    let pair = pty_system
        .openpty(size)
        .map_err(|e| format!("failed to open pty: {e}"))?;

    let shell = command.unwrap_or_else(|| {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string())
    });
    let mut cmd = CommandBuilder::new(&shell);
    if let Some(ref args) = args {
        for arg in args {
            cmd.arg(arg);
        }
    }
    if let Some(ref cwd) = cwd {
        cmd.cwd(cwd);
    }
    if let Some(ref env) = env {
        for (k, v) in env {
            cmd.env(k, v);
        }
    }

    let child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("failed to spawn: {e}"))?;

    let reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("failed to clone pty reader: {e}"))?;
    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("failed to take pty writer: {e}"))?;

    let id = state.counter.fetch_add(1, Ordering::SeqCst);

    let session = Arc::new(ShellSession {
        writer: Mutex::new(writer),
        master: Mutex::new(pair.master),
        child: Mutex::new(child),
    });

    state.sessions.lock().await.insert(id, session);

    // Spawn a thread to read from the PTY and emit events
    let app_handle = app.clone();
    let data_event = format!("macintosh://shell/{}/data", id);
    let exit_event = format!("macintosh://shell/{}/exit", id);
    std::thread::spawn(move || {
        let mut reader = reader;
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app_handle.emit(&data_event, &data);
                }
                Err(_) => break,
            }
        }
        let _ = app_handle.emit(&exit_event, ());
    });

    Ok(id)
}

/// Write data to a shell session's PTY.
#[tauri::command]
pub async fn mac_shell_write(
    id: u64,
    data: String,
    state: tauri::State<'_, Arc<ShellState>>,
) -> Result<(), String> {
    let sessions = state.sessions.lock().await;
    let session = sessions.get(&id).ok_or("session not found")?;
    let mut writer = session.writer.lock().map_err(|e| e.to_string())?;
    writer
        .write_all(data.as_bytes())
        .map_err(|e| format!("write failed: {e}"))?;
    writer.flush().map_err(|e| format!("flush failed: {e}"))
}

/// Resize a shell session's PTY.
#[tauri::command]
pub async fn mac_shell_resize(
    id: u64,
    rows: u16,
    cols: u16,
    state: tauri::State<'_, Arc<ShellState>>,
) -> Result<(), String> {
    let sessions = state.sessions.lock().await;
    let session = sessions.get(&id).ok_or("session not found")?;
    let master = session.master.lock().map_err(|e| e.to_string())?;
    master
        .resize(portable_pty::PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("resize failed: {e}"))
}

/// Kill a shell session and clean up.
#[tauri::command]
pub async fn mac_shell_kill(
    id: u64,
    state: tauri::State<'_, Arc<ShellState>>,
) -> Result<(), String> {
    let mut sessions = state.sessions.lock().await;
    if let Some(session) = sessions.remove(&id) {
        if let Ok(mut child) = session.child.lock() {
            let _ = child.kill();
        }
    }
    Ok(())
}

// ─── System Commands ─────────────────────────────────────────────────────────

/// Get the system hostname.
#[tauri::command]
pub fn mac_system_hostname() -> Result<String, String> {
    hostname::get()
        .map(|h| h.to_string_lossy().into_owned())
        .map_err(|e| format!("failed to get hostname: {e}"))
}

/// Get info about the frontmost application (requires Accessibility access).
#[tauri::command]
pub fn mac_frontmost_app() -> Result<serde_json::Value, String> {
    let script = r#"
        ObjC.import('Cocoa');
        var app = $.NSWorkspace.sharedWorkspace.frontmostApplication;
        JSON.stringify({
            name: ObjC.unwrap(app.localizedName),
            bundleId: app.bundleIdentifier ? ObjC.unwrap(app.bundleIdentifier) : null,
            pid: Number(app.processIdentifier),
        });
    "#;
    let result = run_jxa(script)?;
    serde_json::from_str(&result).map_err(|e| format!("parse error: {e}"))
}

/// Run an Apple Shortcut by name, optionally passing text input.
/// Uses the `shortcuts` CLI tool available on macOS 12+.
#[tauri::command]
pub fn mac_run_shortcut(name: String, input: Option<String>) -> Result<String, String> {
    let mut cmd = std::process::Command::new("shortcuts");
    cmd.args(["run", &name]);
    if let Some(ref input_text) = input {
        cmd.args(["-i", input_text]);
    }
    let output = cmd
        .output()
        .map_err(|e| format!("failed to run shortcut '{}': {e}", name))?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        Err(if stderr.is_empty() {
            format!("shortcut '{}' exited with {}", name, output.status)
        } else {
            stderr
        })
    }
}

/// List all available Apple Shortcuts.
#[tauri::command]
pub fn mac_list_shortcuts() -> Result<Vec<String>, String> {
    let output = std::process::Command::new("shortcuts")
        .arg("list")
        .output()
        .map_err(|e| format!("failed to list shortcuts: {e}"))?;
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.lines().map(|l| l.trim().to_string()).filter(|l| !l.is_empty()).collect())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

/// Run an arbitrary AppleScript string (for power users building tools).
#[tauri::command]
pub fn mac_run_applescript(script: String) -> Result<String, String> {
    let output = std::process::Command::new("osascript")
        .args(["-e", &script])
        .output()
        .map_err(|e| format!("osascript failed: {e}"))?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

/// Run an arbitrary JXA (JavaScript for Automation) script.
#[tauri::command]
pub fn mac_run_jxa(script: String) -> Result<String, String> {
    run_jxa(&script)
}
