use automerge::ReadDoc;
use samod::storage::TokioFilesystemStorage;
use samod::{AcceptorHandle, BackoffConfig, DocumentId, PeerId, Repo};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::tray::TrayIconBuilder;
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tokio::net::TcpListener;
use tokio::sync::{oneshot, Mutex as AsyncMutex};

mod macintosh;

static WINDOW_COUNTER: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(1);

/// A datatype reported by the JS frontend for the tray menu.
#[derive(Clone, Debug, Serialize, Deserialize)]
struct DatatypeInfo {
    id: String,
    name: String,
}

/// User profile info shown in the tray menu.
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
struct UserProfile {
    name: String,
    #[serde(default)]
    avatar_png: Option<Vec<u8>>,
}

/// Tray state: datatypes + user profile.
struct TrayState {
    datatypes: AsyncMutex<Vec<DatatypeInfo>>,
    profile: AsyncMutex<UserProfile>,
}

/// Pending eval requests waiting for JS to respond.
struct EvalState {
    pending: AsyncMutex<HashMap<u64, oneshot::Sender<EvalResponse>>>,
    counter: AtomicU64,
}

#[derive(Serialize, Deserialize)]
struct EvalResponse {
    result: Option<String>,
    error: Option<String>,
}

/// Called by the JS frontend to return the result of an eval request.
#[tauri::command]
async fn resolve_eval(
    id: u64,
    result: Option<String>,
    error: Option<String>,
    state: tauri::State<'_, Arc<EvalState>>,
) -> Result<(), String> {
    if let Some(tx) = state.pending.lock().await.remove(&id) {
        tx.send(EvalResponse { result, error })
            .map_err(|_| "eval response channel closed".to_string())?;
    }
    Ok(())
}

/// Patchwork settings, persisted to a JSON file.
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
struct PatchworkSettings {
    #[serde(default)]
    capture_tool_id: Option<String>,
    #[serde(default)]
    capture_shortcut: Option<String>,
}

fn settings_path() -> std::path::PathBuf {
    dirs::config_dir()
        .expect("could not find config directory")
        .join("patchwork")
        .join("settings.json")
}

fn load_settings() -> PatchworkSettings {
    let path = settings_path();
    match std::fs::read_to_string(&path) {
        Ok(json) => serde_json::from_str(&json).unwrap_or_default(),
        Err(_) => PatchworkSettings::default(),
    }
}

fn save_settings(settings: &PatchworkSettings) -> Result<(), String> {
    let path = settings_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    std::fs::write(&path, json).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_settings() -> Result<PatchworkSettings, String> {
    Ok(load_settings())
}

#[tauri::command]
fn set_settings(settings: PatchworkSettings) -> Result<(), String> {
    save_settings(&settings)
}

/// Register (or re-register) the global shortcut for the capture panel.
fn register_shortcut_for_capture(
    app: &tauri::AppHandle,
    shortcut_str: &str,
) -> Result<(), String> {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    let manager = app.global_shortcut();
    // Unregister all existing shortcuts first
    let _ = manager.unregister_all();

    let app_clone = app.clone();
    manager
        .on_shortcut(shortcut_str, move |_app, _shortcut, event| {
            if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                let _ = show_capture_panel(&app_clone);
            }
        })
        .map_err(|e| format!("failed to register shortcut: {e}"))
}

#[tauri::command]
fn register_capture_shortcut(
    shortcut: String,
    app: tauri::AppHandle,
) -> Result<(), String> {
    register_shortcut_for_capture(&app, &shortcut)?;
    // Persist to settings
    let mut settings = load_settings();
    settings.capture_shortcut = Some(shortcut);
    save_settings(&settings)
}

/// Eval JS in the first available webview window.
/// Used by the HTTP API and could be used by Shortcuts.
async fn eval_in_patchwork(
    app: &tauri::AppHandle,
    eval_state: &Arc<EvalState>,
    code: String,
) -> Result<String, String> {
    let id = eval_state.counter.fetch_add(1, Ordering::SeqCst);
    let (tx, rx) = oneshot::channel();
    eval_state.pending.lock().await.insert(id, tx);

    // Send the eval request to JS
    app.emit("patchwork-eval", serde_json::json!({ "id": id, "code": code }))
        .map_err(|e| format!("failed to emit eval event: {e}"))?;

    match tokio::time::timeout(std::time::Duration::from_secs(30), rx).await {
        Ok(Ok(response)) => {
            if let Some(err) = response.error {
                Err(err)
            } else {
                Ok(response.result.unwrap_or_default())
            }
        }
        Ok(Err(_)) => Err("eval response channel closed".into()),
        Err(_) => Err("eval timed out (30s)".into()),
    }
}

/// Called by the JS frontend whenever the set of registered datatypes changes.
/// Rebuilds the tray menu to include a "New <datatype>" item for each.
#[tauri::command]
async fn update_tray_datatypes(
    datatypes: Vec<DatatypeInfo>,
    app: tauri::AppHandle,
    state: tauri::State<'_, Arc<TrayState>>,
) -> Result<(), String> {
    *state.datatypes.lock().await = datatypes;
    rebuild_tray_menu(&app, &state).await.map_err(|e| e.to_string())
}

/// Called by the JS frontend with the user's profile info from their contact doc.
#[tauri::command]
async fn update_tray_profile(
    name: String,
    avatar_png: Option<Vec<u8>>,
    app: tauri::AppHandle,
    state: tauri::State<'_, Arc<TrayState>>,
) -> Result<(), String> {
    *state.profile.lock().await = UserProfile { name, avatar_png };
    rebuild_tray_menu(&app, &state).await.map_err(|e| e.to_string())
}

async fn rebuild_tray_menu(
    app: &tauri::AppHandle,
    state: &TrayState,
) -> tauri::Result<()> {
    let datatypes = state.datatypes.lock().await;
    let profile = state.profile.lock().await;

    let mut menu_builder = MenuBuilder::new(app);

    // User profile at the top (if available)
    if !profile.name.is_empty() {
        let profile_item = MenuItemBuilder::with_id("tray-profile", &profile.name)
            .enabled(false)
            .build(app)?;
        menu_builder = menu_builder.item(&profile_item).separator();
    }

    // Build the "New" submenu from current datatypes
    let mut new_submenu = SubmenuBuilder::new(app, "New");
    for dt in datatypes.iter() {
        let item = MenuItemBuilder::with_id(
            format!("tray-new-{}", dt.id),
            &dt.name,
        )
        .build(app)?;
        new_submenu = new_submenu.item(&item);
    }
    let new_submenu = new_submenu.build()?;

    let show_patchwork = MenuItemBuilder::with_id("tray-show", "Show Patchwork")
        .build(app)?;

    let show_capture = MenuItemBuilder::with_id("tray-capture", "Capture...")
        .build(app)?;

    let settings = MenuItemBuilder::with_id("tray-settings", "Settings...")
        .build(app)?;

    let quit = MenuItemBuilder::with_id("tray-quit", "Quit Patchwork")
        .build(app)?;

    let menu = menu_builder
        .item(&show_patchwork)
        .separator()
        .item(&new_submenu)
        .item(&show_capture)
        .separator()
        .item(&settings)
        .separator()
        .item(&quit)
        .build()?;

    // Update the existing tray icon's menu
    if let Some(tray) = app.tray_by_id("patchwork-tray") {
        tray.set_menu(Some(menu))?;
        // Update tray icon with avatar if available
        if let Some(png_bytes) = &profile.avatar_png {
            if let Ok(img) = tauri::image::Image::from_bytes(png_bytes) {
                let _ = tray.set_icon(Some(img));
            }
        }
    }

    Ok(())
}

fn create_window(app: &tauri::AppHandle) -> tauri::Result<()> {
    let n = WINDOW_COUNTER.fetch_add(1, Ordering::SeqCst);
    let label = format!("main-{n}");
    WebviewWindowBuilder::new(app, &label, WebviewUrl::default())
        .title("Patchwork")
        .inner_size(1024., 768.)
        .build()?;
    Ok(())
}

fn show_settings_window(app: &tauri::AppHandle) -> tauri::Result<()> {
    if let Some(win) = app.get_webview_window("settings") {
        win.show()?;
        win.set_focus()?;
        return Ok(());
    }

    WebviewWindowBuilder::new(
        app,
        "settings",
        WebviewUrl::App("settings.html".into()),
    )
    .title("Patchwork Settings")
    .inner_size(560., 460.)
    .resizable(true)
    .build()?;

    Ok(())
}

/// Ensure Patchwork is visible and focused. Creates a window if none exist.
/// Returns true if the window was already loaded (existing), false if newly created.
fn ensure_focused(app: &tauri::AppHandle) -> bool {
    let windows = app.webview_windows();
    // Skip non-main windows (settings, capture-panel)
    let main_win = windows.iter().find(|(label, _)| label.starts_with("main-"));
    if let Some((_label, win)) = main_win {
        let _ = win.show();
        let _ = win.set_focus();
        true
    } else {
        // No main windows — create one
        let _ = create_window(app);
        false
    }
}

/// Ensure a window is visible and create a new document of the given datatype.
/// If the window is freshly created, passes the datatype via URL hash so the
/// frontend picks it up on load (since events would be lost before JS loads).
fn ensure_focused_and_new(app: &tauri::AppHandle, datatype_id: &str) {
    let windows = app.webview_windows();
    let main_win = windows.iter().find(|(label, _)| label.starts_with("main-"));
    if let Some((_label, win)) = main_win {
        let _ = win.show();
        let _ = win.set_focus();
        let _ = app.emit("tray-new-document", datatype_id.to_string());
    } else {
        // Create window with new-doc action in the URL hash
        let n = WINDOW_COUNTER.fetch_add(1, Ordering::SeqCst);
        let label = format!("main-{n}");
        let url = WebviewUrl::App(format!("index.html#new={}", datatype_id).into());
        let _ = WebviewWindowBuilder::new(app, &label, url)
            .title("Patchwork")
            .inner_size(1024., 768.)
            .build();
    }
}

fn show_capture_panel(app: &tauri::AppHandle) -> tauri::Result<()> {
    // If the capture panel already exists, just show and focus it
    if let Some(win) = app.get_webview_window("capture-panel") {
        win.show()?;
        win.set_focus()?;
        return Ok(());
    }

    // Create a small panel-style window for capture/browsing
    WebviewWindowBuilder::new(
        app,
        "capture-panel",
        WebviewUrl::App("index.html#frame=capture-panel".into()),
    )
    .title("Patchwork Capture")
    .inner_size(480., 600.)
    .resizable(true)
    .build()?;

    Ok(())
}

/// Combined state for the Axum server: WebSocket sync + HTTP content serving + eval API.
#[derive(Clone)]
struct ServerState {
    acceptor: AcceptorHandle,
    repo: Repo,
    app: tauri::AppHandle,
    eval: Arc<EvalState>,
}

async fn websocket_handler(
    ws: axum::extract::ws::WebSocketUpgrade,
    axum::extract::State(state): axum::extract::State<ServerState>,
) -> axum::response::Response {
    ws.on_upgrade(|socket| async move {
        if let Err(e) = state.acceptor.accept_axum(socket) {
            eprintln!("[sync] failed to accept websocket: {e:?}");
        }
    })
}

/// Parse an automerge URL like "automerge:docId" or "automerge:docId#heads"
/// and return (doc_id, Option<heads_str>).
fn parse_automerge_url(url: &str) -> Option<(String, Option<String>)> {
    let stripped = url.strip_prefix("automerge:")?;
    if let Some((doc_id, heads)) = stripped.split_once('#') {
        Some((doc_id.to_string(), Some(heads.to_string())))
    } else {
        Some((stripped.to_string(), None))
    }
}

/// Encode automerge heads as a base58 comma-separated string.
fn encode_heads(heads: &[automerge::ChangeHash]) -> String {
    heads
        .iter()
        .map(|h| bs58::encode(h.as_ref()).into_string())
        .collect::<Vec<_>>()
        .join(",")
}

/// Guess MIME type from file name.
fn mime_for_path(path: &str) -> &'static str {
    if path.ends_with(".js") || path.ends_with(".mjs") {
        "application/javascript"
    } else if path.ends_with(".ts") || path.ends_with(".mts") {
        "application/javascript"
    } else if path.ends_with(".css") {
        "text/css"
    } else if path.ends_with(".html") {
        "text/html"
    } else if path.ends_with(".json") {
        "application/json"
    } else if path.ends_with(".wasm") {
        "application/wasm"
    } else if path.ends_with(".svg") {
        "image/svg+xml"
    } else if path.ends_with(".png") {
        "image/png"
    } else {
        "text/plain"
    }
}

/// Read a string field from an automerge document.
/// Handles both scalar strings and Text objects.
fn read_str_field(doc: &automerge::Automerge, obj: &automerge::ObjId, key: &str) -> Option<String> {
    match doc.get(obj, key) {
        Ok(Some((automerge::Value::Scalar(s), _))) => {
            if let automerge::ScalarValue::Str(s) = s.as_ref() {
                Some(s.to_string())
            } else {
                None
            }
        }
        Ok(Some((automerge::Value::Object(automerge::ObjType::Text), text_id))) => {
            doc.text(&text_id).ok()
        }
        _ => None,
    }
}

/// Diagnostic info about a folder doc's structure.
struct FolderDiag {
    has_docs: bool,
    doc_count: usize,
    entry_names: Vec<String>,
    root_keys: Vec<String>,
}

/// Navigate a folder doc's `docs` list to find a child entry by name.
/// Returns Ok(url) on success, Err(diagnostic) on failure.
fn find_child_url(doc: &automerge::Automerge, name: &str) -> Result<String, FolderDiag> {
    // Collect root-level keys for diagnostics
    let root_keys: Vec<String> = doc
        .keys(automerge::ROOT)
        .collect();

    let docs_list = match doc.get(automerge::ROOT, "docs") {
        Ok(Some((automerge::Value::Object(automerge::ObjType::List), id))) => id,
        _ => {
            return Err(FolderDiag {
                has_docs: false,
                doc_count: 0,
                entry_names: vec![],
                root_keys,
            });
        }
    };

    let len = doc.length(&docs_list);
    let mut entry_names = Vec::with_capacity(len);

    for i in 0..len {
        if let Ok(Some((automerge::Value::Object(automerge::ObjType::Map), entry_id))) =
            doc.get(&docs_list, i as usize)
        {
            let entry_name = read_str_field(doc, &entry_id, "name").unwrap_or_default();
            if entry_name == name {
                if let Some(url) = read_str_field(doc, &entry_id, "url") {
                    return Ok(url);
                }
            }
            entry_names.push(entry_name);
        }
    }

    Err(FolderDiag {
        has_docs: true,
        doc_count: len,
        entry_names,
        root_keys,
    })
}

/// Handle HTTP requests for automerge content.
/// Reads directly from samod's repo — no JS roundtrip needed.
///
/// URL format: GET /{automerge_url}/{path/to/file}
/// where automerge_url is percent-encoded like "automerge%3AdocId" or "automerge%3AdocId%23heads"
///
/// If the URL has no #heads, we redirect (307) to a heads-pinned URL for caching consistency.
async fn content_handler(
    axum::extract::State(state): axum::extract::State<ServerState>,
    req: axum::extract::Request,
) -> axum::response::Response {
    use axum::http::{HeaderValue, StatusCode};
    use axum::response::IntoResponse;

    let raw_path = req.uri().path().trim_start_matches('/');
    let segments: Vec<&str> = raw_path.splitn(2, '/').collect();

    let cors = |mut resp: axum::http::Response<axum::body::Body>| {
        let h = resp.headers_mut();
        h.insert("access-control-allow-origin", HeaderValue::from_static("*"));
        h.insert(
            "cross-origin-embedder-policy",
            HeaderValue::from_static("credentialless"),
        );
        h.insert(
            "cross-origin-resource-policy",
            HeaderValue::from_static("cross-origin"),
        );
        resp
    };

    // Decode the automerge URL from the first path segment
    let automerge_url = match urlencoding::decode(segments[0]) {
        Ok(u) => u.into_owned(),
        Err(_) => return cors((StatusCode::BAD_REQUEST, "invalid URL encoding").into_response()),
    };

    let (doc_id_str, heads_str) = match parse_automerge_url(&automerge_url) {
        Some(parsed) => parsed,
        None => return cors((StatusCode::BAD_REQUEST, "not an automerge URL").into_response()),
    };

    let doc_id = match doc_id_str.parse::<DocumentId>() {
        Ok(id) => id,
        Err(_) => return cors((StatusCode::BAD_REQUEST, "invalid document ID").into_response()),
    };

    // The sub-path within the folder document (e.g. "src/index.js")
    let sub_path: Vec<&str> = if segments.len() > 1 {
        segments[1].split('/').filter(|s| !s.is_empty()).collect()
    } else {
        vec![]
    };

    // Find the root document in samod's repo
    let root_handle = match state.repo.find(doc_id).await {
        Ok(Some(handle)) => handle,
        Ok(None) => {
            let msg = format!("document not found: {}", automerge_url);
            eprintln!("[content] 404: {}", msg);
            return cors((StatusCode::NOT_FOUND, msg).into_response());
        }
        Err(_) => {
            return cors(
                (StatusCode::INTERNAL_SERVER_ERROR, "repo stopped").into_response(),
            );
        }
    };

    // If no heads in URL, redirect to a heads-pinned URL for caching consistency
    if heads_str.is_none() {
        let heads_encoded = tokio::task::spawn_blocking({
            let handle = root_handle.clone();
            move || handle.with_document(|doc| encode_heads(&doc.get_heads()))
        })
        .await
        .unwrap_or_default();

        let pinned_url = format!("automerge:{}#{}", doc_id_str, heads_encoded);
        let mut location = format!("/{}", urlencoding::encode(&pinned_url));
        if let Some(rest) = segments.get(1) {
            location.push('/');
            location.push_str(rest);
        }
        return cors(
            axum::http::Response::builder()
                .status(StatusCode::TEMPORARY_REDIRECT)
                .header("location", &location)
                .body(axum::body::Body::empty())
                .unwrap_or_else(|_| {
                    (StatusCode::INTERNAL_SERVER_ERROR, "redirect failed").into_response()
                }),
        );
    }

    // Navigate the folder structure: each folder doc has { docs: [{ name, url }] }
    // Follow the sub_path segments through nested folder documents.
    let mut current_handle = root_handle;

    for part in &sub_path {
        // Read the current document to find the child entry
        let result: Result<String, FolderDiag> = tokio::task::spawn_blocking({
            let current = current_handle.clone();
            let part = part.to_string();
            move || current.with_document(|doc| find_child_url(doc, &part))
        })
        .await
        .unwrap_or(Err(FolderDiag {
            has_docs: false,
            doc_count: 0,
            entry_names: vec![],
            root_keys: vec![],
        }));

        let child_url = match result {
            Ok(url) => url,
            Err(diag) => {
                let msg = if !diag.has_docs {
                    format!(
                        "path segment '{}' not found in folder for {} — folder has NO 'docs' array (root keys: [{}])",
                        part,
                        automerge_url,
                        diag.root_keys.join(", ")
                    )
                } else {
                    format!(
                        "path segment '{}' not found in folder for {} — docs has {} entries: [{}]",
                        part,
                        automerge_url,
                        diag.doc_count,
                        diag.entry_names.join(", ")
                    )
                };
                eprintln!("[content] 404: {}", msg);
                return cors((StatusCode::NOT_FOUND, msg).into_response());
            }
        };

        // Parse and find the child document
        let (child_doc_id_str, _child_heads) = match parse_automerge_url(&child_url) {
            Some(parsed) => parsed,
            None => {
                return cors(
                    (StatusCode::INTERNAL_SERVER_ERROR, "invalid child URL").into_response(),
                );
            }
        };

        let child_doc_id = match child_doc_id_str.parse::<DocumentId>() {
            Ok(id) => id,
            Err(_) => {
                return cors(
                    (StatusCode::INTERNAL_SERVER_ERROR, "invalid child document ID").into_response(),
                );
            }
        };

        current_handle = match state.repo.find(child_doc_id).await {
            Ok(Some(handle)) => handle,
            Ok(None) => {
                let msg = format!(
                    "child document {} not found (resolving '{}' in {})",
                    &child_url, part, automerge_url
                );
                eprintln!("[content] 404: {}", msg);
                return cors((StatusCode::NOT_FOUND, msg).into_response());
            }
            Err(_) => {
                return cors(
                    (StatusCode::INTERNAL_SERVER_ERROR, "repo stopped").into_response(),
                );
            }
        };
    }

    // Read the content from the final document
    let result: Option<(Vec<u8>, String)> = tokio::task::spawn_blocking({
        let handle = current_handle;
        let last_segment = sub_path.last().copied().unwrap_or("").to_string();
        move || {
            handle.with_document(|doc| {
                let mime = read_str_field(doc, &automerge::ROOT, "mimeType")
                    .unwrap_or_else(|| mime_for_path(&last_segment).to_string());

                // Try to read "content" field
                match doc.get(automerge::ROOT, "content") {
                    Ok(Some((automerge::Value::Scalar(s), _))) => match s.as_ref() {
                        automerge::ScalarValue::Str(text) => {
                            Some((text.to_string().into_bytes(), mime))
                        }
                        automerge::ScalarValue::Bytes(bytes) => {
                            Some((bytes.to_vec(), mime))
                        }
                        _ => None,
                    },
                    Ok(Some((
                        automerge::Value::Object(automerge::ObjType::Text),
                        text_id,
                    ))) => {
                        let text = doc.text(&text_id).unwrap_or_default();
                        Some((text.into_bytes(), mime))
                    }
                    _ => None,
                }
            })
        }
    })
    .await
    .unwrap_or(None);

    match result {
        Some((body, mime_type)) => cors(
            axum::http::Response::builder()
                .status(StatusCode::OK)
                .header("content-type", mime_type)
                .body(axum::body::Body::from(body))
                .unwrap_or_else(|_| {
                    (StatusCode::INTERNAL_SERVER_ERROR, "failed to build response").into_response()
                }),
        ),
        None => {
            let msg = format!("no content field in document {} (path: {})", automerge_url, raw_path);
            eprintln!("[content] 404: {}", msg);
            cors((StatusCode::NOT_FOUND, msg).into_response())
        }
    }
}

/// HTTP POST /eval — accepts JS code in the request body, evals it in the webview,
/// returns the result. This is the endpoint Apple Shortcuts hits.
async fn eval_handler(
    axum::extract::State(state): axum::extract::State<ServerState>,
    body: String,
) -> axum::response::Response {
    use axum::http::StatusCode;
    use axum::response::IntoResponse;

    match eval_in_patchwork(&state.app, &state.eval, body).await {
        Ok(result) => (StatusCode::OK, result).into_response(),
        Err(err) => (StatusCode::INTERNAL_SERVER_ERROR, err).into_response(),
    }
}

async fn start_sync_server(
    app: tauri::AppHandle,
    eval: Arc<EvalState>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let storage_dir = dirs::cache_dir()
        .expect("could not find cache directory")
        .join("automerge");

    std::fs::create_dir_all(&storage_dir)?;
    eprintln!("[sync] storing data in {}", storage_dir.display());

    let storage = TokioFilesystemStorage::new(&storage_dir);
    let repo = Repo::build_tokio()
        .with_peer_id(PeerId::from("storage-server-patchwork-d9f7e2a1"))
        .with_storage(storage)
        // Only announce documents to upstream sync servers, never to local
        // browser peers. Otherwise opening a window floods the browser with
        // every document samod has ever seen. Browser peers use a
        // "browser-<uuid>" peer ID (set in main.ts).
        .with_announce_policy(|_doc: DocumentId, peer: PeerId| {
            !peer.as_str().starts_with("browser-")
        })
        .load()
        .await;
    eprintln!("[sync] repo loaded");

    // Connect upstream to the remote sync server (non-fatal if it fails)
    let upstream_url: samod::Url = "wss://sync3.automerge.org".parse().expect("valid url");
    match repo.dial_websocket(upstream_url, BackoffConfig::default()) {
        Ok(_dialer) => eprintln!("[sync] dialing upstream sync3.automerge.org"),
        Err(e) => eprintln!("[sync] failed to connect upstream: {e:?}"),
    }

    // Accept local WebSocket connections from the frontend
    let listener = TcpListener::bind("127.0.0.1:3030").await?;
    eprintln!("[sync] listening on 127.0.0.1:3030");

    let local_url: samod::Url = "ws://127.0.0.1:3030".parse().expect("valid url");
    let acceptor = repo.make_acceptor(local_url)?;

    let state = ServerState {
        acceptor,
        repo,
        app,
        eval,
    };

    let router = axum::Router::new()
        // WebSocket sync on the root path
        .route("/", axum::routing::get(websocket_handler))
        // Eval JS in the webview — POST /eval
        .route("/eval", axum::routing::post(eval_handler))
        // Automerge content served directly from samod's repo
        .fallback(axum::routing::get(content_handler))
        .with_state(state);

    axum::serve(listener, router).await?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let tray_state = Arc::new(TrayState {
        datatypes: AsyncMutex::new(Vec::new()),
        profile: AsyncMutex::new(UserProfile::default()),
    });

    let eval_state = Arc::new(EvalState {
        pending: AsyncMutex::new(HashMap::new()),
        counter: AtomicU64::new(0),
    });

    let shell_state = Arc::new(macintosh::ShellState::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(tray_state.clone())
        .manage(eval_state.clone())
        .manage(shell_state)
        .invoke_handler(tauri::generate_handler![
            update_tray_datatypes,
            update_tray_profile,
            resolve_eval,
            get_settings,
            set_settings,
            register_capture_shortcut,
            macintosh::mac_list_processes,
            macintosh::mac_running_apps,
            macintosh::mac_execute,
            macintosh::mac_reminders_get_lists,
            macintosh::mac_reminders_get_items,
            macintosh::mac_reminders_create,
            macintosh::mac_reminders_complete,
            macintosh::mac_calendar_get_calendars,
            macintosh::mac_calendar_get_events,
            macintosh::mac_calendar_create_event,
            macintosh::mac_shell_spawn,
            macintosh::mac_shell_write,
            macintosh::mac_shell_resize,
            macintosh::mac_shell_kill,
            macintosh::mac_system_hostname,
            macintosh::mac_frontmost_app,
            macintosh::mac_run_shortcut,
            macintosh::mac_list_shortcuts,
            macintosh::mac_run_applescript,
            macintosh::mac_run_jxa
        ])
        .setup(move |app| {
            let app_handle = app.handle().clone();
            let eval = eval_state.clone();

            // Start the embedded sync + content server in the background
            tauri::async_runtime::spawn(async move {
                match start_sync_server(app_handle, eval).await {
                    Ok(()) => eprintln!("[sync] server shut down"),
                    Err(e) => eprintln!("[sync] server error: {e}"),
                }
            });

            // Register the global capture shortcut from settings (if configured)
            let settings = load_settings();
            if let Some(ref shortcut) = settings.capture_shortcut {
                if let Err(e) = register_shortcut_for_capture(app.handle(), shortcut) {
                    eprintln!("[shortcut] failed to register '{}': {}", shortcut, e);
                }
            }

            // Create initial window
            WebviewWindowBuilder::new(app, "main-0", WebviewUrl::default())
                .title("Patchwork")
                .inner_size(1024., 768.)
                .build()?;

            // Build native menu with File > New Window
            let new_window_menu = MenuItemBuilder::with_id("new-window", "New Window")
                .accelerator("CmdOrCtrl+N")
                .build(app)?;

            let settings_menu = MenuItemBuilder::with_id("menu-settings", "Settings...")
                .accelerator("CmdOrCtrl+,")
                .build(app)?;

            let quit_menu = MenuItemBuilder::with_id("menu-quit", "Quit Patchwork")
                .accelerator("CmdOrCtrl+Q")
                .build(app)?;

            let app_menu = SubmenuBuilder::new(app, "Patchwork")
                .item(&settings_menu)
                .separator()
                .item(&quit_menu)
                .build()?;

            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&new_window_menu)
                .separator()
                .close_window()
                .build()?;

            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;

            let window_menu = SubmenuBuilder::new(app, "Window")
                .minimize()
                .separator()
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&app_menu)
                .item(&file_menu)
                .item(&edit_menu)
                .item(&window_menu)
                .build()?;

            app.set_menu(menu)?;

            app.on_menu_event(move |app, event| {
                if event.id() == "new-window" {
                    let _ = create_window(app);
                } else if event.id() == "menu-settings" {
                    let _ = show_settings_window(app);
                } else if event.id() == "menu-quit" {
                    app.exit(0);
                }
            });

            // --- System tray ---
            // Start with a minimal menu; JS will call update_tray_datatypes
            // once plugins are loaded to populate the "New" submenu.
            let tray_show = MenuItemBuilder::with_id("tray-show", "Show Patchwork")
                .build(app)?;
            let tray_capture = MenuItemBuilder::with_id("tray-capture", "Capture...")
                .build(app)?;
            let tray_quit = MenuItemBuilder::with_id("tray-quit", "Quit Patchwork")
                .build(app)?;

            let tray_menu = MenuBuilder::new(app)
                .item(&tray_show)
                .separator()
                .item(&tray_capture)
                .separator()
                .item(&tray_quit)
                .build()?;

            let _tray = TrayIconBuilder::with_id("patchwork-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| {
                    let id = event.id().as_ref();
                    if id == "tray-show" {
                        ensure_focused(app);
                    } else if id == "tray-capture" {
                        let _ = show_capture_panel(app);
                    } else if id == "tray-settings" {
                        let _ = show_settings_window(app);
                    } else if id == "tray-quit" {
                        app.exit(0);
                    } else if let Some(datatype_id) = id.strip_prefix("tray-new-") {
                        ensure_focused_and_new(app, datatype_id);
                    }
                })
                .build(app)?;

            Ok(())
        })
        // On macOS: hide the last main window instead of closing it so the
        // app stays backgrounded with a warm webview. Additional windows
        // close normally.
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let app = window.app_handle();
                let main_count = app
                    .webview_windows()
                    .keys()
                    .filter(|l| l.starts_with("main-"))
                    .count();
                if main_count <= 1 && window.label().starts_with("main-") {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            match event {
                // Prevent auto-exit when all windows are closed.
                // The app stays alive in the tray. Cmd+Q / tray "Quit" still work
                // because they call app.exit() directly.
                tauri::RunEvent::ExitRequested { api, .. } => {
                    api.prevent_exit();
                }
                // macOS: user clicked the dock icon — show a window.
                // Since we hide (rather than destroy) the last window, there
                // may be a hidden window we can re-show.
                tauri::RunEvent::Reopen { .. } => {
                    ensure_focused(app);
                }
                _ => {}
            }
        });
}
