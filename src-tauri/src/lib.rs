use samod::storage::TokioFilesystemStorage;
use samod::{AcceptorHandle, BackoffConfig, PeerId, Repo};
use serde::Deserialize;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tokio::net::TcpListener;
use tokio::sync::{oneshot, Mutex as AsyncMutex};

static WINDOW_COUNTER: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(1);

/// Shared state for the patchwork:// custom protocol handler.
/// Rust registers the protocol, then forwards resolution requests to JS
/// (which has the automerge repo) via Tauri events. JS calls back with
/// the resolved content via the `resolve_protocol_request` command.
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

fn create_window(app: &tauri::AppHandle) -> tauri::Result<()> {
    let n = WINDOW_COUNTER.fetch_add(1, Ordering::SeqCst);
    let label = format!("main-{n}");
    WebviewWindowBuilder::new(app, &label, WebviewUrl::default())
        .title("Patchwork")
        .inner_size(1024., 768.)
        .build()?;
    Ok(())
}

async fn websocket_handler(
    ws: axum::extract::ws::WebSocketUpgrade,
    axum::extract::State(acceptor): axum::extract::State<AcceptorHandle>,
) -> axum::response::Response {
    ws.on_upgrade(|socket| async move {
        if let Err(e) = acceptor.accept_axum(socket) {
            eprintln!("[sync] failed to accept websocket: {e:?}");
        }
    })
}

async fn start_sync_server() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
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

    let app = axum::Router::new()
        .route("/", axum::routing::get(websocket_handler))
        .with_state(acceptor);

    axum::serve(listener, app).await?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let protocol_state = Arc::new(ProtocolState {
        pending: AsyncMutex::new(HashMap::new()),
        counter: AtomicU64::new(0),
    });
    let protocol_state_for_handler = protocol_state.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(protocol_state)
        .invoke_handler(tauri::generate_handler![resolve_protocol_request])
        .register_asynchronous_uri_scheme_protocol(
            "patchwork",
            move |ctx, request, responder| {
                let state = protocol_state_for_handler.clone();
                let app = ctx.app_handle().clone();
                let uri = request.uri().to_string();

                tauri::async_runtime::spawn(async move {
                    let id = state.counter.fetch_add(1, Ordering::SeqCst);
                    let (tx, rx) = oneshot::channel();
                    state.pending.lock().await.insert(id, tx);

                    // Ask the JS side to resolve this URL
                    let _ = app.emit(
                        "patchwork-protocol-request",
                        serde_json::json!({ "id": id, "url": uri }),
                    );

                    match tokio::time::timeout(std::time::Duration::from_secs(30), rx).await {
                        Ok(Ok(response)) => {
                            let mut builder = tauri::http::Response::builder()
                                .status(response.status)
                                .header("content-type", &response.mime_type);

                            for (key, value) in &response.headers {
                                builder = builder.header(key.as_str(), value.as_str());
                            }

                            // Always set CORS headers so tauri:// can fetch patchwork://
                            builder = builder
                                .header("access-control-allow-origin", "tauri://localhost")
                                .header("cross-origin-embedder-policy", "credentialless")
                                .header("cross-origin-resource-policy", "cross-origin");

                            responder.respond(
                                builder.body(response.body).unwrap_or_else(|_| {
                                    tauri::http::Response::builder()
                                        .status(500)
                                        .body(b"failed to build response".to_vec())
                                        .unwrap()
                                }),
                            );
                        }
                        Ok(Err(_)) => {
                            responder.respond(
                                tauri::http::Response::builder()
                                    .status(500)
                                    .body(b"protocol handler channel closed".to_vec())
                                    .unwrap(),
                            );
                        }
                        Err(_) => {
                            eprintln!(
                                "[protocol] timeout resolving {uri} (waited 30s for JS response)"
                            );
                            responder.respond(
                                tauri::http::Response::builder()
                                    .status(504)
                                    .body(b"protocol handler timeout".to_vec())
                                    .unwrap(),
                            );
                        }
                    }
                });
            },
        )
        .setup(|app| {
            // Start the embedded sync server in the background
            tauri::async_runtime::spawn(async {
                match start_sync_server().await {
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
            let new_window = MenuItemBuilder::with_id("new-window", "New Window")
                .accelerator("CmdOrCtrl+N")
                .build(app)?;

            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&new_window)
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

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
