use samod::storage::TokioFilesystemStorage;
use samod::{AcceptorHandle, BackoffConfig, PeerId, Repo};
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::{WebviewUrl, WebviewWindowBuilder};
use tokio::net::TcpListener;

static WINDOW_COUNTER: std::sync::atomic::AtomicU32 = std::sync::atomic::AtomicU32::new(1);

fn create_window(app: &tauri::AppHandle) -> tauri::Result<()> {
    let n = WINDOW_COUNTER.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
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
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
