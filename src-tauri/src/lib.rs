use samod::storage::TokioFilesystemStorage;
use samod::{AcceptorHandle, BackoffConfig, PeerId, Repo};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::tray::TrayIconBuilder;
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tokio::net::TcpListener;
use tokio::sync::{oneshot, Mutex as AsyncMutex};

static WINDOW_COUNTER: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(1);

/// Shared state for bridging HTTP content requests to JS.
/// Rust receives the HTTP request, forwards it to JS (which has the automerge
/// repo) via Tauri events, and JS calls back with the resolved content via the
/// `resolve_protocol_request` command.
struct ProtocolState {
    pending: AsyncMutex<HashMap<u64, oneshot::Sender<ProtocolResponse>>>,
    counter: AtomicU64,
}

#[derive(Deserialize)]
struct ProtocolResponse {
    body: Vec<u8>,
    #[serde(default = "default_mime")]
    mime_type: String,
    #[serde(default = "default_status")]
    status: u16,
    #[serde(default)]
    headers: HashMap<String, String>,
}

fn default_mime() -> String {
    "text/plain".into()
}

fn default_status() -> u16 {
    200
}

/// A datatype reported by the JS frontend for the tray menu.
#[derive(Clone, Debug, Serialize, Deserialize)]
struct DatatypeInfo {
    id: String,
    name: String,
}

/// Datatypes known to the tray, updated by the frontend via `update_tray_datatypes`.
struct TrayDatatypes {
    datatypes: AsyncMutex<Vec<DatatypeInfo>>,
}

#[tauri::command]
async fn resolve_protocol_request(
    id: u64,
    body: Vec<u8>,
    mime_type: String,
    status: u16,
    headers: HashMap<String, String>,
    state: tauri::State<'_, Arc<ProtocolState>>,
) -> Result<(), String> {
    if let Some(tx) = state.pending.lock().await.remove(&id) {
        tx.send(ProtocolResponse {
            body,
            mime_type,
            status,
            headers,
        })
        .map_err(|_| "response channel closed".to_string())?;
    }
    Ok(())
}

/// Called by the JS frontend whenever the set of registered datatypes changes.
/// Rebuilds the tray menu to include a "New <datatype>" item for each.
#[tauri::command]
async fn update_tray_datatypes(
    datatypes: Vec<DatatypeInfo>,
    app: tauri::AppHandle,
    state: tauri::State<'_, Arc<TrayDatatypes>>,
) -> Result<(), String> {
    *state.datatypes.lock().await = datatypes;
    rebuild_tray_menu(&app, &state).await.map_err(|e| e.to_string())
}

async fn rebuild_tray_menu(
    app: &tauri::AppHandle,
    state: &TrayDatatypes,
) -> tauri::Result<()> {
    let datatypes = state.datatypes.lock().await;

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
    let new_submenu = new_submenu.build(app)?;

    let show_capture = MenuItemBuilder::with_id("tray-capture", "Capture...")
        .build(app)?;

    let new_window = MenuItemBuilder::with_id("tray-new-window", "New Window")
        .build(app)?;

    let quit = MenuItemBuilder::with_id("tray-quit", "Quit Patchwork")
        .build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&new_submenu)
        .item(&show_capture)
        .separator()
        .item(&new_window)
        .separator()
        .item(&quit)
        .build(app)?;

    // Update the existing tray icon's menu
    if let Some(tray) = app.tray_by_id("patchwork-tray") {
        tray.set_menu(Some(menu))?;
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

/// Combined state for the Axum server: WebSocket sync + HTTP content serving.
#[derive(Clone)]
struct ServerState {
    acceptor: AcceptorHandle,
    app: tauri::AppHandle,
    protocol: Arc<ProtocolState>,
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

/// Handle HTTP requests for automerge content.
/// Bridges to JS via Tauri events, returns the response (including 307 redirects).
async fn content_handler(
    axum::extract::State(state): axum::extract::State<ServerState>,
    req: axum::extract::Request,
) -> axum::response::Response {
    use axum::http::{HeaderValue, StatusCode};
    use axum::response::IntoResponse;

    let uri = req.uri().to_string();
    // Build a URL matching the format JS expects
    let url = format!("http://localhost:3030{uri}");

    let id = state.protocol.counter.fetch_add(1, Ordering::SeqCst);
    let (tx, rx) = oneshot::channel();
    state.protocol.pending.lock().await.insert(id, tx);

    // Ask the JS side to resolve this URL
    let _ = state.app.emit(
        "patchwork-protocol-request",
        serde_json::json!({ "id": id, "url": url }),
    );

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

    match tokio::time::timeout(std::time::Duration::from_secs(30), rx).await {
        Ok(Ok(response)) => {
            let status =
                StatusCode::from_u16(response.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
            let mut builder = axum::http::Response::builder()
                .status(status)
                .header("content-type", &response.mime_type);

            for (key, value) in &response.headers {
                builder = builder.header(key.as_str(), value.as_str());
            }

            cors(
                builder
                    .body(axum::body::Body::from(response.body))
                    .unwrap_or_else(|_| {
                        (StatusCode::INTERNAL_SERVER_ERROR, "failed to build response")
                            .into_response()
                    }),
            )
        }
        Ok(Err(_)) => cors(
            (StatusCode::INTERNAL_SERVER_ERROR, "protocol handler channel closed").into_response(),
        ),
        Err(_) => {
            eprintln!("[content] timeout resolving {url} (waited 30s for JS response)");
            cors((StatusCode::GATEWAY_TIMEOUT, "protocol handler timeout").into_response())
        }
    }
}

async fn start_sync_server(
    app: tauri::AppHandle,
    protocol: Arc<ProtocolState>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let storage_dir = dirs::cache_dir()
        .expect("could not find cache directory")
        .join("automerge");

    std::fs::create_dir_all(&storage_dir)?;
    eprintln!("[sync] storing data in {}", storage_dir.display());

    let storage = TokioFilesystemStorage::new(&storage_dir);
    let repo = Repo::build_tokio()
        .with_peer_id(PeerId::from("storage-server-patchwork"))
        .with_storage(storage)
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
        app,
        protocol,
    };

    let router = axum::Router::new()
        // WebSocket sync on the root path
        .route("/", axum::routing::get(websocket_handler))
        // Automerge content on all other paths
        .fallback(axum::routing::get(content_handler))
        .with_state(state);

    axum::serve(listener, router).await?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let protocol_state = Arc::new(ProtocolState {
        pending: AsyncMutex::new(HashMap::new()),
        counter: AtomicU64::new(0),
    });

    let tray_datatypes = Arc::new(TrayDatatypes {
        datatypes: AsyncMutex::new(Vec::new()),
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(protocol_state.clone())
        .manage(tray_datatypes.clone())
        .invoke_handler(tauri::generate_handler![
            resolve_protocol_request,
            update_tray_datatypes
        ])
        .setup(move |app| {
            let app_handle = app.handle().clone();
            let protocol = protocol_state.clone();

            // Start the embedded sync + content server in the background
            tauri::async_runtime::spawn(async move {
                match start_sync_server(app_handle, protocol).await {
                    Ok(()) => eprintln!("[sync] server shut down"),
                    Err(e) => eprintln!("[sync] server error: {e}"),
                }
            });

            // Create initial window
            WebviewWindowBuilder::new(app, "main-0", WebviewUrl::default())
                .title("Patchwork")
                .inner_size(1024., 768.)
                .build()?;

            // Build native menu with File > New Window
            let new_window_menu = MenuItemBuilder::with_id("new-window", "New Window")
                .accelerator("CmdOrCtrl+N")
                .build(app)?;

            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&new_window_menu)
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
                .item(&file_menu)
                .item(&edit_menu)
                .item(&window_menu)
                .build()?;

            app.set_menu(menu)?;

            app.on_menu_event(move |app, event| {
                if event.id() == "new-window" {
                    let _ = create_window(app);
                }
            });

            // --- System tray ---
            // Start with a minimal menu; JS will call update_tray_datatypes
            // once plugins are loaded to populate the "New" submenu.
            let tray_new_window = MenuItemBuilder::with_id("tray-new-window", "New Window")
                .build(app)?;
            let tray_capture = MenuItemBuilder::with_id("tray-capture", "Capture...")
                .build(app)?;
            let tray_quit = MenuItemBuilder::with_id("tray-quit", "Quit Patchwork")
                .build(app)?;

            let tray_menu = MenuBuilder::new(app)
                .item(&tray_capture)
                .separator()
                .item(&tray_new_window)
                .separator()
                .item(&tray_quit)
                .build()?;

            let _tray = TrayIconBuilder::with_id("patchwork-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .menu_on_left_click(true)
                .on_menu_event(|app, event| {
                    let id = event.id().as_ref();
                    if id == "tray-new-window" {
                        let _ = create_window(app);
                    } else if id == "tray-capture" {
                        let _ = show_capture_panel(app);
                    } else if id == "tray-quit" {
                        app.exit(0);
                    } else if let Some(datatype_id) = id.strip_prefix("tray-new-") {
                        // Tell JS to create a new document of this type
                        let _ = app.emit("tray-new-document", datatype_id.to_string());
                    }
                })
                .build(app)?;

            Ok(())
        })
        // Keep running in the background when all windows are closed
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Don't exit — tray keeps the app alive
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
