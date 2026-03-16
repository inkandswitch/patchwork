/**
 * Patchwork Settings — standalone page for the settings window.
 * Communicates with the Rust backend via Tauri invoke commands.
 */

interface PatchworkSettings {
  capture_tool_id: string | null;
  capture_shortcut: string | null;
}

const invoke: (cmd: string, args?: Record<string, unknown>) => Promise<any> =
  (window as any).__TAURI__?.core?.invoke ??
  (async () => {
    throw new Error("Not running in Tauri");
  });

// --- Render ---

document.documentElement.style.cssText =
  "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f5f5f5; color: #1d1d1f;";

document.body.innerHTML = `
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { padding: 24px 32px; }
  h1 { font-size: 20px; font-weight: 600; margin-bottom: 24px; }
  .section { background: #fff; border-radius: 10px; padding: 0; margin-bottom: 16px; box-shadow: 0 0.5px 1px rgba(0,0,0,0.1); }
  .section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #86868b; padding: 8px 16px 4px; letter-spacing: 0.5px; }
  .row { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 0.5px solid #e5e5e5; min-height: 44px; }
  .row:last-child { border-bottom: none; }
  .row-label { font-size: 14px; }
  .row-value { font-size: 14px; color: #86868b; display: flex; align-items: center; gap: 8px; }
  input[type="text"] {
    border: 1px solid #d2d2d7; border-radius: 6px; padding: 4px 8px;
    font-size: 13px; width: 180px; text-align: right; outline: none;
    font-family: ui-monospace, monospace;
  }
  input[type="text"]:focus { border-color: #0071e3; box-shadow: 0 0 0 2px rgba(0,113,227,0.2); }
  select {
    border: 1px solid #d2d2d7; border-radius: 6px; padding: 4px 8px;
    font-size: 13px; background: #fff; outline: none;
  }
  .shortcut-capture {
    cursor: pointer; user-select: none;
  }
  .shortcut-capture.recording {
    border-color: #ff9500; box-shadow: 0 0 0 2px rgba(255,149,0,0.3);
  }
  .hint { font-size: 11px; color: #86868b; padding: 4px 16px 12px; }
  .status { font-size: 12px; color: #34c759; margin-top: 4px; opacity: 0; transition: opacity 0.3s; }
  .status.show { opacity: 1; }
</style>

<h1>Settings</h1>

<div class="section-title">Capture</div>
<div class="section">
  <div class="row">
    <span class="row-label">Global shortcut</span>
    <div class="row-value">
      <input type="text" id="shortcut-input" class="shortcut-capture" placeholder="Click to record..." readonly />
    </div>
  </div>
  <div class="hint">Click the field, then press your desired key combination.</div>
</div>

<div class="section-title">About</div>
<div class="section">
  <div class="row">
    <span class="row-label">Version</span>
    <span class="row-value">0.1.0</span>
  </div>
</div>

<div class="status" id="status">Saved</div>
`;

// --- Logic ---

const shortcutInput = document.getElementById(
  "shortcut-input"
) as HTMLInputElement;
const statusEl = document.getElementById("status")!;

let currentSettings: PatchworkSettings = {
  capture_tool_id: null,
  capture_shortcut: null,
};

function showStatus(msg: string) {
  statusEl.textContent = msg;
  statusEl.classList.add("show");
  setTimeout(() => statusEl.classList.remove("show"), 1500);
}

// Format a keyboard event into a Tauri-style shortcut string
function formatShortcut(e: KeyboardEvent): string | null {
  const parts: string[] = [];
  if (e.metaKey) parts.push("Command");
  if (e.ctrlKey) parts.push("Control");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");

  const key = e.key;
  // Skip if only modifier keys are pressed
  if (["Meta", "Control", "Alt", "Shift"].includes(key)) return null;

  // Map common keys to Tauri names
  const keyMap: Record<string, string> = {
    " ": "Space",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    Enter: "Return",
    Backspace: "Backspace",
    Delete: "Delete",
    Escape: "Escape",
    Tab: "Tab",
  };

  const mappedKey = keyMap[key] ?? key.toUpperCase();
  parts.push(mappedKey);

  return parts.join("+");
}

// Load settings
async function loadSettings() {
  try {
    currentSettings = await invoke("get_settings");
    if (currentSettings.capture_shortcut) {
      shortcutInput.value = currentSettings.capture_shortcut;
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
}

// Shortcut recording
let recording = false;

shortcutInput.addEventListener("click", () => {
  recording = true;
  shortcutInput.classList.add("recording");
  shortcutInput.value = "Press keys...";
});

shortcutInput.addEventListener("blur", () => {
  if (recording) {
    recording = false;
    shortcutInput.classList.remove("recording");
    shortcutInput.value = currentSettings.capture_shortcut ?? "";
  }
});

shortcutInput.addEventListener("keydown", async (e) => {
  if (!recording) return;
  e.preventDefault();
  e.stopPropagation();

  const shortcut = formatShortcut(e);
  if (!shortcut) return; // only modifiers pressed

  recording = false;
  shortcutInput.classList.remove("recording");
  shortcutInput.value = shortcut;

  try {
    await invoke("register_capture_shortcut", { shortcut });
    currentSettings.capture_shortcut = shortcut;
    showStatus("Shortcut saved");
  } catch (err: any) {
    shortcutInput.value = currentSettings.capture_shortcut ?? "";
    showStatus(`Error: ${err}`);
  }
});

// Escape cancels recording
document.addEventListener("keydown", (e) => {
  if (recording && e.key === "Escape") {
    recording = false;
    shortcutInput.classList.remove("recording");
    shortcutInput.value = currentSettings.capture_shortcut ?? "";
  }
});

loadSettings();
