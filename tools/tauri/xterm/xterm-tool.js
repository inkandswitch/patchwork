/**
 * Terminal tool — renders an xterm.js terminal connected to a real macOS PTY
 * via window.macintosh.shell (Tauri bridge).
 *
 * Loads xterm.js and the fit addon from CDN since patchwork tools are
 * self-contained modules without a build step.
 */

const XTERM_CSS_URL = "https://cdn.jsdelivr.net/npm/@xterm/xterm@5/css/xterm.min.css";
const XTERM_JS_URL = "https://cdn.jsdelivr.net/npm/@xterm/xterm@5/lib/xterm.min.js";
const FIT_ADDON_URL = "https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0/lib/addon-fit.min.js";
const WEBGL_ADDON_URL = "https://cdn.jsdelivr.net/npm/@xterm/addon-webgl@0/lib/addon-webgl.min.js";

function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function Tool(handle, element) {
  const style = document.createElement("style");
  style.textContent = `
    .xterm-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background: #1e1e1e;
      overflow: hidden;
    }
    .xterm-container .xterm-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      background: #2d2d2d;
      border-bottom: 1px solid #404040;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      color: #ccc;
      flex-shrink: 0;
    }
    .xterm-container .xterm-toolbar button {
      background: #404040;
      color: #ccc;
      border: 1px solid #555;
      border-radius: 4px;
      padding: 2px 8px;
      cursor: pointer;
      font-size: 11px;
    }
    .xterm-container .xterm-toolbar button:hover {
      background: #505050;
    }
    .xterm-container .xterm-terminal-wrap {
      flex: 1;
      overflow: hidden;
      padding: 4px;
    }
    .xterm-container .xterm-status {
      padding: 4px 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 11px;
      color: #888;
      background: #2d2d2d;
      border-top: 1px solid #404040;
      flex-shrink: 0;
    }
    .xterm-container .xterm-no-macintosh {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #888;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      text-align: center;
      padding: 20px;
    }
  `;
  element.appendChild(style);

  const container = document.createElement("div");
  container.className = "xterm-container";
  element.appendChild(container);

  let terminal = null;
  let fitAddon = null;
  let shell = null;
  let resizeObserver = null;
  let cleaned = false;

  async function init() {
    if (!window.macintosh) {
      container.innerHTML = `<div class="xterm-no-macintosh">
        <div>
          <p><strong>Terminal requires the Patchwork desktop app</strong></p>
          <p>The terminal tool uses window.macintosh to spawn a real PTY shell.<br>
          It is not available in the browser.</p>
        </div>
      </div>`;
      return;
    }

    // Load xterm.js dependencies
    loadCSS(XTERM_CSS_URL);
    await loadScript(XTERM_JS_URL);
    await loadScript(FIT_ADDON_URL);

    // Build UI
    const toolbar = document.createElement("div");
    toolbar.className = "xterm-toolbar";

    const titleSpan = document.createElement("span");
    titleSpan.style.flex = "1";
    const doc = handle.doc();
    titleSpan.textContent = doc?.title || "Terminal";
    toolbar.appendChild(titleSpan);

    const newBtn = document.createElement("button");
    newBtn.textContent = "New Session";
    newBtn.addEventListener("click", () => spawnShell());
    toolbar.appendChild(newBtn);

    container.appendChild(toolbar);

    const termWrap = document.createElement("div");
    termWrap.className = "xterm-terminal-wrap";
    container.appendChild(termWrap);

    const statusBar = document.createElement("div");
    statusBar.className = "xterm-status";
    statusBar.textContent = "Starting...";
    container.appendChild(statusBar);

    // Initialize xterm.js
    terminal = new window.Terminal({
      fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
      fontSize: 13,
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        cursor: "#d4d4d4",
        selectionBackground: "#264f78",
        black: "#1e1e1e",
        red: "#f44747",
        green: "#6a9955",
        yellow: "#dcdcaa",
        blue: "#569cd6",
        magenta: "#c586c0",
        cyan: "#4ec9b0",
        white: "#d4d4d4",
        brightBlack: "#808080",
        brightRed: "#f44747",
        brightGreen: "#6a9955",
        brightYellow: "#dcdcaa",
        brightBlue: "#569cd6",
        brightMagenta: "#c586c0",
        brightCyan: "#4ec9b0",
        brightWhite: "#ffffff",
      },
      cursorBlink: true,
      allowProposedApi: true,
    });

    fitAddon = new window.FitAddon.FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(termWrap);

    // Try loading WebGL addon for better performance
    try {
      await loadScript(WEBGL_ADDON_URL);
      const webglAddon = new window.WebglAddon.WebglAddon();
      terminal.loadAddon(webglAddon);
    } catch {
      // WebGL not available, software renderer is fine
    }

    fitAddon.fit();

    // Watch for resize
    resizeObserver = new ResizeObserver(() => {
      if (fitAddon && terminal) {
        fitAddon.fit();
        if (shell) {
          shell.resize(terminal.rows, terminal.cols);
        }
      }
    });
    resizeObserver.observe(termWrap);

    // Update title when doc changes
    handle.on("change", () => {
      const d = handle.doc();
      if (d) titleSpan.textContent = d.title || "Terminal";
    });

    // Spawn the shell
    statusBar.textContent = "Connecting...";
    await spawnShell();
    statusBar.textContent = "Connected";

    async function spawnShell() {
      // Kill existing shell if any
      if (shell) {
        try { await shell.kill(); } catch {}
      }

      terminal.clear();
      terminal.reset();
      fitAddon.fit();

      const doc = handle.doc();
      const opts = { rows: terminal.rows, cols: terminal.cols };
      if (doc?.cwd) opts.cwd = doc.cwd;

      shell = await window.macintosh.shell.spawn(opts);

      // PTY → terminal
      shell.onData((data) => {
        if (terminal) terminal.write(data);
      });

      // Terminal → PTY
      terminal.onData((data) => {
        if (shell) shell.write(data);
      });

      shell.onExit(() => {
        if (cleaned) return;
        statusBar.textContent = "Shell exited — press New Session to restart";
        terminal.write("\r\n\x1b[90m[shell exited]\x1b[0m\r\n");
        shell = null;
      });

      statusBar.textContent = "Connected";
    }
  }

  init().catch((err) => {
    container.innerHTML = `<div class="xterm-no-macintosh">
      <div>
        <p><strong>Failed to start terminal</strong></p>
        <p>${err.message || err}</p>
      </div>
    </div>`;
  });

  return () => {
    cleaned = true;
    if (resizeObserver) resizeObserver.disconnect();
    if (shell) {
      shell.kill().catch(() => {});
      shell = null;
    }
    if (terminal) {
      terminal.dispose();
      terminal = null;
    }
    container.remove();
    style.remove();
  };
}
